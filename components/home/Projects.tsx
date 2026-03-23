import { projects } from "@/lib/projects";

export default function Projects() {
  return (
    <section
      id="projects"
      className="border-t border-gray-200 px-8 py-20 max-w-3xl mx-auto w-full"
    >
      <h2 className="text-xl font-bold mb-6">Projects</h2>
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-3 pr-8 font-bold">Name</th>
            <th className="pb-3 pr-8 font-bold">Description</th>
            <th className="pb-3 font-bold">Link</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.name} className="border-b border-gray-100">
              <td className="py-3 pr-8 font-medium">{project.name}</td>
              <td className="py-3 pr-8 text-gray-600">{project.description}</td>
              <td className="py-3">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-500 transition-colors"
                >
                  {project.linkLabel ?? "GitHub"}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
