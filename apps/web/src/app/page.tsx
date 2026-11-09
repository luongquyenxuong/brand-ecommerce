export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
      <section>
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
          Dự án
        </p>

        <h1 className="text-4xl font-bold sm:text-5xl">
          Brand Commerce
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Frontend đã sẵn sàng. Chúng ta sẽ xây dựng từng bước từ
          danh mục sản phẩm đến giỏ hàng, đặt hàng và quản trị.
        </p>

        <div className="mt-8 inline-block rounded-lg bg-white px-5 py-3 shadow-sm">
          B0.4A — Next.js đang hoạt động
        </div>
      </section>
    </main>
  );
}