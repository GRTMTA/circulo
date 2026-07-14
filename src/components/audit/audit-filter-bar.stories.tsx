import type { Meta, StoryObj } from "@storybook/nextjs";

import {
  auditEventTypesFixture,
  createMembersFixture,
} from "../../../.storybook/fixtures";
import { AuditFilterBar } from "@/components/audit/audit-filter-bar";

const meta = {
  title: "Audit/Audit Filter Bar",
  component: AuditFilterBar,
  args: {
    eventTypes: auditEventTypesFixture,
    members: createMembersFixture(),
  },
} satisfies Meta<typeof AuditFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyFilters: Story = {};
export const FewEvents: Story = {
  args: { eventTypes: auditEventTypesFixture.slice(0, 3) },
};

