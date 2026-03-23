import { publicServices } from "@/lib/public-services";

export default function PublicServices() {
  return (
    <section
      id="services"
      className="border-t border-gray-200 px-8 py-20 max-w-3xl mx-auto w-full"
    >
      <h2 className="text-xl font-bold text-black mb-6">
        Free Public Services
      </h2>
      <p className="text-gray-600 text-sm leading-7 mb-6">
        Services hosted by me, avaliable for free public use.
      </p>
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-3 pr-8 font-bold text-black">Name</th>
            <th className="pb-3 pr-8 font-bold text-black">Description</th>
            <th className="pb-3 font-bold text-black">Link</th>
          </tr>
        </thead>
        <tbody>
          {publicServices.map((service) => (
            <tr key={service.name} className="border-b border-gray-100">
              <td className="py-3 pr-8 font-medium text-black">
                {service.name}
              </td>
              <td className="py-3 pr-8 text-gray-600">{service.description}</td>
              <td className="py-3">
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-500 transition-colors"
                >
                  {service.linkLabel ?? "Visit"}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
