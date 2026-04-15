import DepartmentManagementClient from "./department-management-client"

export default function AdminDepartmentsPage() {
  // 暂时使用模拟数据，后续可以从数据库获取
  const initialDepartments = [
    {
      id: "dept-1",
      name: "计算机学院",
      code: "CS",
      description: "计算机科学与技术学院",
      createdAt: new Date("2024-01-15"),
      majors: [
        { id: "major-1", name: "计算机科学与技术", code: "CS001", departmentId: "dept-1" },
        { id: "major-2", name: "软件工程", code: "SE001", departmentId: "dept-1" },
        { id: "major-3", name: "网络工程", code: "NE001", departmentId: "dept-1" },
      ]
    },
    {
      id: "dept-2",
      name: "电子信息学院",
      code: "EE",
      description: "电子信息工程学院",
      createdAt: new Date("2024-01-20"),
      majors: [
        { id: "major-4", name: "电子信息工程", code: "EE001", departmentId: "dept-2" },
        { id: "major-5", name: "通信工程", code: "CE001", departmentId: "dept-2" },
      ]
    },
    {
      id: "dept-3",
      name: "经济管理学院",
      code: "EM",
      description: "经济与管理学院",
      createdAt: new Date("2024-01-25"),
      majors: [
        { id: "major-6", name: "工商管理", code: "BA001", departmentId: "dept-3" },
        { id: "major-7", name: "市场营销", code: "MK001", departmentId: "dept-3" },
      ]
    }
  ]

  return <DepartmentManagementClient initialDepartments={initialDepartments} />
}