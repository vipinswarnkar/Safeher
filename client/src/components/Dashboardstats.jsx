function DashboardStats({ dashboard }) {
  return (
    <div className="grid grid-cols-2 gap-4">

      <div className="bg-white rounded-3xl shadow p-5">
        <p className="text-sm text-slate-500">
          Total Journeys
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {dashboard?.totalJourneys ?? 0}
        </h2>
      </div>

      <div className="bg-white rounded-3xl shadow p-5">
        <p className="text-sm text-slate-500">
          Trusted Contacts
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {dashboard?.contactsCount ?? 0}
        </h2>
      </div>

    </div>
  );
}

export default DashboardStats;