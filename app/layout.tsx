export const metadata = {
  title: 'DX Card Game'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body
        className="scrollbar-thin bg-slate-800 text-slate-300"
        style={{ backgroundImage: "url('/background-1.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
      >
        {children}
      </body>
    </html>
  );
}
