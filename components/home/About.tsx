import Link from "next/link";

export default function About() {
  return (
    <section
      id="about"
      className="border-t border-gray-200 px-8 py-20 max-w-3xl mx-auto w-full"
    >
      <h2 className="text-xl font-bold mb-4">About Me</h2>
      <p className="text-gray-600 text-sm leading-7 mb-4">
        Hi, I&apos;m Aidan — an open-source developer, sysadmin, and student.
      </p>
      <p className="text-gray-600 text-sm leading-7 mb-4">
        I primarially work with JavaScript/TypeScript, especially in terms of
        frontend and backend development. I&apos;m also a big fan of Linux and
        self-hosting.
      </p>
      <p className="text-gray-600 text-sm leading-7">
        Most days, you can find me obsessing over Next.js,{" "}
        <Link href="https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping">
          ORMs
        </Link>
        , and my homelab.
      </p>
    </section>
  );
}
