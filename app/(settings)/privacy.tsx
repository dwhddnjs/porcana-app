import Container from '@/components/ui/container';
import { Header } from '@/components/ui/header';
import { LegalContent } from '@/components/settings/legal-content';
import { PRIVACY_SECTIONS } from '@/lib/constant/legal';

export default function PrivacyScreen() {
  return (
    <Container>
      <Header title="개인정보처리방침" />
      <LegalContent sections={PRIVACY_SECTIONS} />
    </Container>
  );
}
