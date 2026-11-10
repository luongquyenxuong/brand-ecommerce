import { randomBytes, scryptSync } from 'node:crypto';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

config({
  path: resolve(process.cwd(), '../../.env'),
});

const permissions = [
  { code: 'catalog.read', name: 'Xem catalog' },
  { code: 'catalog.write', name: 'Quản lý catalog' },
  { code: 'inventory.read', name: 'Xem tồn kho' },
  { code: 'inventory.adjust', name: 'Điều chỉnh tồn kho' },
  { code: 'orders.read', name: 'Xem đơn hàng' },
  { code: 'orders.update', name: 'Xử lý đơn hàng' },
  { code: 'shipments.update', name: 'Cập nhật giao hàng' },
  { code: 'payments.reconcile', name: 'Đối soát COD' },
  { code: 'refunds.manage', name: 'Xử lý hoàn tiền' },
  { code: 'coupons.manage', name: 'Quản lý coupon' },
  { code: 'users.manage', name: 'Quản lý tài khoản nhân viên' },
  { code: 'roles.manage', name: 'Quản lý phân quyền' },
  { code: 'audit.read', name: 'Xem lịch sử thao tác' },
];

const roles = [
  {
    code: 'ADMIN',
    name: 'Quản trị viên',
    permissions: permissions.map((permission) => permission.code),
  },
  {
    code: 'CATALOG',
    name: 'Nhân viên sản phẩm',
    permissions: ['catalog.read', 'catalog.write'],
  },
  {
    code: 'WAREHOUSE',
    name: 'Nhân viên kho',
    permissions: ['catalog.read', 'inventory.read', 'inventory.adjust'],
  },
  {
    code: 'ORDER_STAFF',
    name: 'Nhân viên đơn hàng',
    permissions: [
      'catalog.read',
      'inventory.read',
      'orders.read',
      'orders.update',
      'shipments.update',
    ],
  },
  {
    code: 'FINANCE',
    name: 'Nhân viên tài chính',
    permissions: ['orders.read', 'payments.reconcile', 'refunds.manage'],
  },
  {
    code: 'MARKETING',
    name: 'Nhân viên marketing',
    permissions: ['catalog.read', 'coupons.manage'],
  },
];

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');

  const hash = scryptSync(password, salt, 64, {
    N: 131072,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
  });

  return ['scrypt', '131072', '8', '1', salt, hash.toString('hex')].join('$');
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const fullName = process.env.ADMIN_NAME?.trim() || 'Quản trị viên';
  const password = process.env.ADMIN_PASSWORD;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL');
  }

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error('ADMIN_EMAIL is invalid');
  }

  if (fullName.length > 150) {
    throw new Error('ADMIN_NAME must not exceed 150 characters');
  }

  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (
      existing &&
      (existing.status !== 'ACTIVE' ||
        !existing.roles.some((item) => item.role.code === 'ADMIN'))
    ) {
      throw new Error(
        'Email already belongs to a disabled or non-admin account. ' +
          'Bootstrap will not change its status or permissions.',
      );
    }

    let passwordHash: string | undefined;

    if (!existing) {
      const length = password ? Array.from(password).length : 0;

      if (!password || length < 15 || length > 128) {
        throw new Error('ADMIN_PASSWORD must contain 15–128 characters');
      }

      passwordHash = hashPassword(password);
    }

    await prisma.$transaction(
      async (tx) => {
        for (const permission of permissions) {
          await tx.permission.upsert({
            where: { code: permission.code },
            update: {},
            create: permission,
          });
        }

        for (const roleDefinition of roles) {
          const role = await tx.role.upsert({
            where: { code: roleDefinition.code },
            update: {},
            create: {
              code: roleDefinition.code,
              name: roleDefinition.name,
            },
          });

          for (const permissionCode of roleDefinition.permissions) {
            const permission = await tx.permission.findUniqueOrThrow({
              where: { code: permissionCode },
            });

            await tx.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          }
        }

        if (!existing) {
          if (!passwordHash) {
            throw new Error('Password hash was not generated');
          }

          const adminRole = await tx.role.findUniqueOrThrow({
            where: { code: 'ADMIN' },
          });

          await tx.user.create({
            data: {
              email,
              fullName,
              passwordHash,
              status: 'ACTIVE',
              roles: {
                create: {
                  roleId: adminRole.id,
                },
              },
            },
          });
        }
      },
      { timeout: 20000 },
    );

    console.log('Roles and permissions are ready');
    console.log(
      existing
        ? 'Admin already exists; password was not changed'
        : 'Admin account created',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Admin bootstrap failed:', error);
  process.exitCode = 1;
});
