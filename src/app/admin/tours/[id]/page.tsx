import TourBuilder from "@/components/admin/TourBuilder";

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TourBuilder tourId={Number(id)} />;
}
