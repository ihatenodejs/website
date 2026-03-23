import Projects from "@/components/home/Projects";
import PublicServices from "@/components/home/PublicServices";
import Hero from "@/components/home/Hero";
import Contact from "@/components/home/Contact";
import About from "@/components/home/About";
import SidePane from "@/components/home/SidePane";

export default function Home() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-sans mx-auto w-full max-w-7xl">
      <main className="flex-1 flex flex-col bg-white">
        <Hero />
        <About />
        <Projects />
        <PublicServices />
        <Contact />
      </main>
      <SidePane className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white shrink-0" />
    </div>
  );
}
