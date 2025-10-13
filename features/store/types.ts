export type Store = {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  verificationStatus: "UNVERIFIED" | "VERIFIED";
};