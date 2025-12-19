import { ContactHeroSection } from "@/features/contact/components/ContactHeroSection";
import { ContactEmailSection } from "@/features/contact/components/ContactEmailSection";
import { ContactDocsSection } from "@/features/contact/components/ContactDocsSection";
import { ContactCommunitySection } from "@/features/contact/components/ContactCommunitySection";
import { ContactTransparencySection } from "@/features/contact/components/ContactTransparencySection";
import { ContactCtaSection } from "@/features/contact/components/ContactCtaSection";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

export function ContactPage() {
  useDocumentTitle("Contact Us");

  return (
    <div>
      <ContactHeroSection />
      <ContactEmailSection />
      <ContactDocsSection />
      <ContactCommunitySection />
      <ContactTransparencySection />
      <ContactCtaSection />
    </div>
  );
}
