import { OrganizationList } from "@clerk/nextjs"

export default function ChooseOrganizationPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <OrganizationList
        hidePersonal={false}
        afterCreateOrganizationUrl="/"
        afterSelectOrganizationUrl="/"
        afterSelectPersonalUrl="/"
      />
    </div>
  )
}
