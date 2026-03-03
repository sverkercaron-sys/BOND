import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'BOND — Stärk er relation | Dagliga övningar för par',
  description: 'Bättre relationer börjar med 3 minuter om dagen. Dagliga övningar baserade på 40 års relationsforskning. Gratis.',
  keywords: ['relation', 'par', 'övningar', 'Gottman', 'relationsforskning'],
  openGraph: {
    title: 'BOND — Stärk er relation',
    description: 'Dagliga övningar baserade på 40 års relationsforskning. Gratis.',
    type: 'website',
    url: 'https://bond.app',
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-bond-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-bond-primary">BOND</div>
          <Link href="/login" className="text-bond-secondary hover:text-bond-primary transition">
            Logga in
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-bond-primary mb-6 leading-tight">
            Bättre relationer börjar med 3 minuter om dagen.
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
            Dagliga övningar baserade på 40 års relationsforskning. Gratis.
          </p>

          {/* Subtle illustration with emojis */}
          <div className="flex justify-center gap-4 mb-12 text-5xl">
            <span>❤️</span>
            <span>🌱</span>
            <span>✨</span>
          </div>

          <Link
            href="/signup"
            className="inline-block bg-bond-secondary hover:bg-bond-secondary-dark text-white px-8 sm:px-12 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105 shadow-lg"
          >
            Kom igång
          </Link>

          <p className="text-gray-500 text-sm mt-4">Ingen kreditkort krävs</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-32 bg-bond-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-bond-primary text-center mb-16">
            Så fungerar BOND
          </h2>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-bond-50">
              <div className="text-5xl mb-4">1</div>
              <h3 className="text-xl font-semibold text-bond-primary mb-3">Registrera er</h3>
              <p className="text-gray-600">
                Skapa ett konto och bjud in er partner. Det tar mindre än en minut.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-bond-50">
              <div className="text-5xl mb-4">2</div>
              <h3 className="text-xl font-semibold text-bond-primary mb-3">3 minuter om dagen</h3>
              <p className="text-gray-600">
                Gör tillsammans övning tillsammans varje dag. Enkelt, meningsfullt och roligt.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-bond-50">
              <div className="text-5xl mb-4">3</div>
              <h3 className="text-xl font-semibold text-bond-primary mb-3">Se er växa</h3>
              <p className="text-gray-600">
                Spåra framsteg och fira milstolpar tillsammans. Bygg en starkare relation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-bond-primary text-center mb-16">
            Vad får ni?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 border-2 border-bond-secondary rounded-lg hover:bg-bond-50 transition">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="font-semibold text-bond-primary mb-2">90 forskninsbaserade övningar</h3>
              <p className="text-sm text-gray-600">Alla baserade på Gottman-institutets metoder.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 border-2 border-bond-secondary rounded-lg hover:bg-bond-50 transition">
              <div className="text-3xl mb-3">🔥</div>
              <h3 className="font-semibold text-bond-primary mb-2">Streak-system</h3>
              <p className="text-sm text-gray-600">Bygg streaks och håll motivationen uppe tillsammans.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 border-2 border-bond-secondary rounded-lg hover:bg-bond-50 transition">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-bond-primary mb-2">Relationstemperatur</h3>
              <p className="text-sm text-gray-600">Se veckovisa insikter om er relationshälsa.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 border-2 border-bond-secondary rounded-lg hover:bg-bond-50 transition">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-semibold text-bond-primary mb-2">Helt gratis</h3>
              <p className="text-sm text-gray-600">Ingen prenumeration, ingen paywalls. För alltid.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 sm:py-24 bg-bond-primary text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg sm:text-xl leading-relaxed">
            Baserat på <span className="font-semibold">Gottman-institutets forskning</span> om vad som gör relationer hållbara. Utvecklat för par som vill investera i sin relation – 3 minuter i taget.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-bond-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-bond-primary mb-8">
            Redo att börja?
          </h2>
          <Link
            href="/signup"
            className="inline-block bg-bond-secondary hover:bg-bond-secondary-dark text-white px-8 sm:px-12 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105 shadow-lg"
          >
            Kom igång
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bond-50 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-gray-600 text-center">
              En produkt av{' '}
              <span className="font-semibold text-bond-primary">Dripline</span>
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <Link href="/about" className="hover:text-bond-primary transition">
              Om oss
            </Link>
            <Link href="/privacy" className="hover:text-bond-primary transition">
              Integritetspolicy
            </Link>
            <Link href="/terms" className="hover:text-bond-primary transition">
              Användarvillkor
            </Link>
            <a 
              href="https://dripline.se" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-bond-primary transition"
            >
              Dripline.se
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-bond-50">
            <p className="text-center text-xs text-gray-500">
              © 2026 BOND. Gjort med ❤️ för par som vill växa tillsammans.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
