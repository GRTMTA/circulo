import type { Meta, StoryObj } from "@storybook/nextjs";

import { TableFilterBar } from "@/components/ui/table-filter-bar";

const meta = {
  title: "UI/Table Filter Bar",
  component: TableFilterBar,
  args: {
    searchValue: "",
    onSearchChange: () => {},
    searchPlaceholder: "Search by name...",
    filters: [
      {
        id: "status",
        label: "Status",
        value: null,
        options: [
          { value: "paid", label: "Paid" },
          { value: "pending", label: "Pending" },
          { value: "late", label: "Late" },
        ],
        onChange: () => {},
      },
      {
        id: "role",
        label: "Role",
        value: null,
        options: [
          { value: "creator", label: "Creator" },
          { value: "member", label: "Member" },
        ],
        onChange: () => {},
      },
    ],
    totalCount: 5,
    filteredCount: 5,
    onClearFilters: () => {},
    hasActiveFilters: false,
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof TableFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActiveFilters: Story = {
  args: {
    searchValue: "Ari",
    hasActiveFilters: true,
    filteredCount: 1,
    filters: [{
      "id": "status",
      "label": "Status",
      "value": "paid",
      "onChange": () => {},
      "options": [{
        "value": "paid",
        "label": "Paid"
      }, {
        "value": "pending",
        "label": "Pending"
      }]
    }],
  },
};

export const NoFilters: Story = {
  args: {
    filters: [],
  },
};

export const AllFilteredOut: Story = {
  args: {
    hasActiveFilters: true,
    filteredCount: 0,
    totalCount: 5,
    searchValue: "zzz",
  },
};
