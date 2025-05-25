export interface Plot {
    $id?: string;
    title: string;
    location: string;
    description?: string;
    size?: number;
    latitude?: number;
    longitude?: number;
    price: number;
    imageUrl?: string[];
    status?: string;
    projects: string; // Related project ID
  }