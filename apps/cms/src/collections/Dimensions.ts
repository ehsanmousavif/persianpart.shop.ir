import type { CollectionConfig } from "payload";

export const Dimensions: CollectionConfig = {
  slug: "dimensions",
  labels: {
    singular: "بُعد / سایز",
    plural: "ابعاد کاشی",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: [
      "name",
      "width",
      "height",
      "slug",
      "isActive",
      "createdAt",
    ],
    group: "کاتالوگ و انبارداری",
    description: "ابعاد استاندارد کاشی و سرامیک.",
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "عنوان سایز (مثال: ۶۰×۱۲۰)",
    },
    {
      type: "row",
      fields: [
        {
          name: "width",
          type: "number",
          required: true,
          label: "عرض (cm)",
          admin: { width: "50%" },
        },
        {
          name: "height",
          type: "number",
          required: true,
          label: "طول (cm)",
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      label: "شناسه یکتا (Slug)",
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
      label: "فعال",
    },
  ],
};
