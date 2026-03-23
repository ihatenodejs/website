import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black flex items-center justify-between px-4 py-4">
      <div className="bg-white text-md font-bold w-10 h-10 flex items-center justify-center">
        AH
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="bg-white font-bold text-md px-4 py-2 hover:bg-gray-200 transition-colors"
        >
          Home
        </Link>
        <Link
          href="/#about"
          className="bg-white font-bold text-md px-4 py-2 hover:bg-gray-200 transition-colors"
        >
          About
        </Link>
        <Link
          href="/#projects"
          className="bg-white font-bold text-md px-4 py-2 hover:bg-gray-200 transition-colors"
        >
          Projects
        </Link>
        <Link
          href="/#services"
          className="bg-white font-bold text-md px-4 py-2 hover:bg-gray-200 transition-colors"
        >
          Services
        </Link>
        <Link
          href="/#contact"
          className="bg-white font-bold text-md px-4 py-2 hover:bg-gray-200 transition-colors"
        >
          Contact
        </Link>
      </div>
    </nav>
  );
}
