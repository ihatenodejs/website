import { SiGithub, SiInstagram } from "react-icons/si";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-8 py-32">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Aidan Honor</h1>
      <p className="italic mb-14">What is life without data?</p>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/ihatenodejs"
          className="bg-black text-white text-sm font-medium p-4 hover:bg-gray-800 transition-colors"
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SiGithub size={16} />
        </a>
        <a
          href="https://instagram.com/aidxnsalive"
          className="bg-black text-white text-sm font-medium p-4 hover:bg-gray-800 transition-colors"
          aria-label="Instagram"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SiInstagram size={16} />
        </a>
      </div>
    </section>
  );
}
