import logo from '../assets/ogp.png';

function BrandLogo() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={logo}
        alt="Company Logo"
        className="h-10 sm:h-12 w-auto object-contain flex-shrink-0"
      />
      <div className="min-w-0">
        <h1 className="font-black text-slate-900 tracking-wide text-sm sm:text-lg md:text-xl break-words">
          TOYOTA BOSHOKU
        </h1>
        <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-bold tracking-widest uppercase break-words">
          Device India Private Limited
        </p>
      </div>
    </div>
  );
}

export default BrandLogo;
