import GithubWidget from "./widgets/GithubWidget";
import WikipediaWidget from "./widgets/WikipediaWidget";
import ListenBrainzWidget from "./widgets/ListenBrainzWidget";

export default function SidePane({ className = "" }: { className?: string }) {
  return (
    <aside className={`flex flex-col gap-8 p-8 ${className}`}>
      <GithubWidget />
      <WikipediaWidget />
      <ListenBrainzWidget />
    </aside>
  );
}
