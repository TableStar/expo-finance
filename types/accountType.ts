export type Account = {
  id: number;
  name: string;
  icon: "wallet"|"bank"|"cellphone";
  color: string;
  created_at: string;
};

export type AccountFormData = {
  name: string;
  icon: string;
  color?: string;
};
