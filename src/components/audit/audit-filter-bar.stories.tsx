import type { Meta, StoryObj } from "@storybook/nextjs";

import { AuditFilterBar } from "@/components/audit/audit-filter-bar";
import { createMockMembers, mockAuditEventTypes } from "@/lib/mocks";

const meta = {
  title: "Audit/Audit Filter Bar",
  component: AuditFilterBar,
  args: {
    eventTypes: mockAuditEventTypes,
    members: createMockMembers(),
  },
} satisfies Meta<typeof AuditFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyFilters: Story = {};
export const FewEvents: Story = { args: { eventTypes: mockAuditEventTypes.slice(0, 3) } };

