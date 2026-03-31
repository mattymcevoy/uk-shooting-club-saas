export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy (UK GDPR)</h1>
      <p>
        This platform processes personal data for club membership administration, bookings, event attendance,
        coaching records, compliance checks, and financial processing.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Lawful basis</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Contractual necessity for memberships, bookings, and payment processing.</li>
          <li>Legal obligation for regulated shooting-club compliance checks.</li>
          <li>Legitimate interests for operational safety, incident handling, and anti-fraud controls.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data Subject Rights</h2>
        <p>
          Members can request access/export, correction, and erasure requests through the privacy request API.
          Requests are tracked and auditable for governance purposes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Retention</h2>
        <p>
          We retain operational records only as long as necessary for legal, contractual, and safety obligations.
        </p>
      </section>
    </main>
  );
}
