import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import TrafficOverview from "../components/TrafficOverview";
import RecentActivity from "../components/RecentActivity";

function Dashboard() {
    return (
      <div className="p-6 space-y-6">{/* changed: added vertical spacing */}
        {/* replace inline header with reusable PageHeader */}
        <PageHeader
          title="Dashboard"
          action={{ label: "New Report" }}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Users" value="1,248" />
          <SummaryCard label="Active Today" value="317" />
          <SummaryCard label="Revenue" value="$12,340" />
          <SummaryCard label="Errors" value="8" />
        </div>

        {/* Charts + activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TrafficOverview
            className="col-span-2"
            title="Traffic Overview"
            ranges={["Last 7 days", "Last 30 days", "Last 90 days"]}
            selectedRange="Last 7 days"
          />
          <RecentActivity
            items={[
              { text: "User john_d added a new item", time: "2m ago" },
              { text: "Backup completed", time: "1h ago" },
              { text: "New subscription", time: "3h ago" },
            ]}
          />
        </div>
      </div>
    );
  }

  export default Dashboard;
  