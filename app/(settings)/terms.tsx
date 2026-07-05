import Container from '@/components/ui/container';
import { Header } from '@/components/ui/header';
import { LegalContent } from '@/components/settings/legal-content';
import { TERMS_SECTIONS } from '@/lib/constant/legal';

export default function TermsScreen() {
  return (
    <Container>
      <Header title="이용약관" />
      <LegalContent sections={TERMS_SECTIONS} />
    </Container>
  );
}
