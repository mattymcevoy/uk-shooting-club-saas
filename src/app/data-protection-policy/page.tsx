export default function DataProtectionPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Data Protection Policy</h1>
      <p>
        We apply privacy-by-design, least-privilege RBAC, organization-scoped isolation, and event-level auditability.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Security Controls</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Role-based access controls with permission matrix and scoped API authorization.</li>
          <li>Segregation of organization data for multi-tenant safety.</li>
          <li>Controlled processing of sensitive compliance and incident records.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Breach & Incident Handling</h2>
        <p>
          Security incidents are logged and triaged via incident workflows, with documented remediation and review.
        </p>
      </section>
    </main>
  );
}
