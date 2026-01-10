import PageHeader from "../components/PageHeader";
import Card from "../ui/Card";

function Appointments() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Appointments" action={{ label: "New Appointment" }} />
      <Card>
        <div className="text-sm text-gray-600">
          Appointment calendar placeholder. Integrate your scheduler component here.
        </div>
      </Card>
    </div>
  );
}

export default Appointments;