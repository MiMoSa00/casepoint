import { db } from "@/db"
import { notFound } from "next/navigation"
import DesignPreview from "./DesignPreview"
import { headers } from 'next/headers'

interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

const Page = async ({ searchParams }: PageProps) => {
  const { id } = searchParams

  if (!id || typeof id !== "string") {
    return notFound()
  }

  try {
    const configuration = await db.configuration.findUnique({
      where: { id },
    })

    if (!configuration) {
      return notFound()
    }

    return <DesignPreview configuration={configuration} />
  } catch (error) {
    console.error('Database connection error:', error)
    
    // In development, show more detailed error
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
    
    // In production, show a user-friendly error
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-xl font-bold text-red-600">
            Unable to load configuration
          </h1>
          <p className="text-gray-600">
            Please try again later or contact support if the problem persists.
          </p>
        </div>
      </div>
    )
  }
}

export default Page