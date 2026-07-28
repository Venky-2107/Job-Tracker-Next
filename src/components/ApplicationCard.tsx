import { ApplicationRequest } from "@/types";
import { useDeleteApplicationMutation } from "@/store/applicationApi";

export default function ApplicationCard({
  application,
}: {
  application: ApplicationRequest;
}) {
  const {
    company_name,
    role,
    application_status,
    date_of_interview,
    date_applied,
    id,
  } = application;
  // console.log("application props", application);
  const [deleteUser, { isLoading, isError }] = useDeleteApplicationMutation();

  const handleDelete = async (id: number) => {
    try {
      console.log("something inside try deletion");
      const result = await deleteUser(id).unwrap();
      console.log("result of delettion", result);
    } catch (err: any) {
      console.log("error or deletion", err);
    }
  };

  return (
    <section className="flex flex-col w-40 h-60 rounded-xl bg-cyan-400 shadow-lg shadow-cyan-500/50 p-2">
      <h3>{company_name}</h3>
      <h3>{role}</h3>
      <h3>{application_status}</h3>
      <h3>
        {date_of_interview
          ? new Date(date_of_interview).toLocaleDateString()
          : "N/A"}
      </h3>
      <h3>{date_applied}</h3>

      <section className="mt-auto self-end">
        <button
          className="text-white bg-red-400 rounded-xl px-2"
          onClick={() => handleDelete(id)}
        >
          Delete
        </button>
      </section>
    </section>
  );
}
