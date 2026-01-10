import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
import { NavLink } from "react-router-dom";

function Laboratory() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Laboratory" />
      <Card>
        <div className="flex items-center gap-6">
          <NavLink to="/laboratory/internal" className="text-teal-700 underline">
            Internal Lab Works
          </NavLink>
          <NavLink to="/laboratory/external" className="text-teal-700 underline">
            External Lab Works
          </NavLink>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Choose a section to manage lab orders and workflows.
        </p>
      </Card>
    </div>
  );
}

export default Laboratory;