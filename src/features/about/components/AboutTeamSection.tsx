import { Mail, Users } from "lucide-react";
import LinkedInSocial from "@/shared/icons/socials/LinkedInSocial";
import XSocial from "@/shared/icons/socials/XSocial";

const TEAM = [
  {
    name: "Alireza",
    role: "Tech",
    email: "mailto:alireza@example.com",
    linkedin: "https://linkedin.com/in/alireza",
    twitter: "https://x.com/alireza",
  },
  {
    name: "MoeNick",
    role: "Product",
    email: "mailto:moenick@example.com",
    linkedin: "https://linkedin.com/in/moenick",
    twitter: "https://x.com/moenick",
  },
  {
    name: "Ahmad",
    role: "Business",
    email: "mailto:ahmad@example.com",
    linkedin: "https://linkedin.com/in/ahmad",
    twitter: "https://x.com/ahmad",
  },
  {
    name: "Freshelle",
    role: "Finance",
    email: "mailto:freshelle@example.com",
    linkedin: "https://linkedin.com/in/freshelle",
    twitter: "https://x.com/freshelle",
  },
  {
    name: "Mo",
    role: "UI / UX",
    email: "mailto:mo@example.com",
    linkedin: "https://linkedin.com/in/mo",
    twitter: "https://x.com/mo",
  },
  {
    name: "Griff",
    role: "Advisor",
    email: "mailto:griff@example.com",
    linkedin: "https://linkedin.com/in/griff",
    twitter: "https://x.com/griff",
  },
];

export function AboutTeamSection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col gap-16 py-20 sm:py-28 lg:py-32">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-500">
              <Users className="h-4 w-4" />
              The Team
            </div>
            <h2 className="max-w-[700px] text-3xl font-bold leading-tight text-black-500 sm:text-4xl lg:text-5xl">
              Who's Behind CrowdWalrus
            </h2>
            <p className="max-w-[700px] text-lg text-black-300">
              CrowdWalrus is a product of{" "}
              <strong className="text-black-500">General Magic</strong> in
              partnership with{" "}
              <strong className="text-black-500">Walrus</strong>. Built by
              former Giveth contributors with deep experience in blockchain,
              product, and ecosystem building.
            </p>
          </div>

          {/* Team Grid */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {TEAM.map((member, idx) => (
              <div
                key={idx}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-white-600 bg-white-100 p-6 transition-all hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xl font-bold text-white-50">
                  {member.name.charAt(0)}
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div>
                    <h3 className="text-base font-bold text-black-500">
                      {member.name}
                    </h3>
                    <p className="text-sm text-black-300">{member.role}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white-600 bg-white-50 px-2 py-1.5 transition-transform duration-300 ease-out hover:scale-110">
                    <a
                      href={member.email}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-6 w-6 items-center justify-center text-black-300 transition-colors hover:text-blue-500"
                      aria-label="Email"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                    <div className="h-3 w-px bg-white-600" />
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-6 w-6 items-center justify-center text-black-300 transition-colors hover:text-blue-500"
                      aria-label="LinkedIn"
                    >
                      <LinkedInSocial size={13} />
                    </a>
                    <div className="h-3 w-px bg-white-600" />
                    <a
                      href={member.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-6 w-6 items-center justify-center text-black-300 transition-colors hover:text-blue-500"
                      aria-label="X (Twitter)"
                    >
                      <XSocial size={13} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Partners */}
          <div className="flex flex-col items-center gap-8">
            <p className="text-base font-medium text-black-300">Our Partners</p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              <div className="flex h-12 items-center justify-center rounded-xl bg-black-500 px-6">
                <span className="text-lg font-bold text-white-50">Walrus</span>
              </div>
              <div className="flex h-12 items-center justify-center rounded-xl bg-purple-500 px-6">
                <span className="text-lg font-bold text-white-50">
                  General Magic
                </span>
              </div>
              <div className="flex h-12 items-center justify-center rounded-xl bg-blue-500 px-6">
                <span className="text-lg font-bold text-white-50">Giveth</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
