import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Stacq",
  description: "The Expert Filter for the Digital Age.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
          The Expert Filter <br />
          for the <span className="text-primary">Digital Age.</span>
        </h1>
        <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
          Stop searching and start finding. Stacq helps you curate the
          high-signal resources that Google and AI often miss.
        </p>
      </div>

      <div className="space-y-6 text-foreground/80 leading-relaxed text-lg">
        <p>
          Search engines optimize for engagement. AI curates for consensus. But
          the highest value signals on the internet still come from passionate
          individuals organizing what they know.
        </p>
        <p>
          Stacq is a platform for experts, hobbyists, and tinkerers to build
          beautiful, modular collections of the best resources on the web, and
          share them with the world natively.
        </p>
        <div className="pt-8 border-t border-border mt-12 bg-surface/50 p-8 rounded-3xl">
          <h3 className="font-bold text-xl mb-2 text-foreground">
            Our Mission
          </h3>
          <p>
            To organize the internet&apos;s best resources through the lens of
            human expertise, creating the most high-signal discovery platform in
            the world.
          </p>
        </div>
      </div>
    </div>
  );
}
