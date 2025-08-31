"use client"

import { StudentForm } from "@/components/forms/student-form"

export default function NewStudentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Student</h1>
        <p className="text-muted-foreground">Create a new student record and assign fees</p>
      </div>

      <StudentForm />
    </div>
  )
}
