const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export class ApiClient {
  private static baseUrl = API_BASE_URL

  static async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`)
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]))
        }
      })
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      let detailMsg = ""
      try {
        const errJson = await res.json()
        detailMsg = errJson.detail || errJson.message || ""
      } catch {
        // ignore
      }
      throw new Error(detailMsg || `API GET Error [${res.status}]: ${res.statusText} on ${path}`)
    }
    return res.json()
  }

  static async post<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let detailMsg = ""
      try {
        const errJson = await res.json()
        detailMsg = errJson.detail || errJson.message || ""
      } catch {
        // ignore
      }
      throw new Error(detailMsg || `API POST Error [${res.status}]: ${res.statusText} on ${path}`)
    }
    return res.json()
  }

  static async put<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`API PUT Error [${res.status}]: ${res.statusText} on ${path}`)
    }
    return res.json()
  }

  static async delete<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`)
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]))
        }
      })
    }

    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      throw new Error(`API DELETE Error [${res.status}]: ${res.statusText} on ${path}`)
    }
    return res.json()
  }
}
