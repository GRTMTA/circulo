import type { CircleEnrichedDTO, CirclesDTO } from "@/lib/dashboard/types";
import { createCircleMock, createCirclesListMock } from "@/lib/mocks";

export async function getMockDashboardDTO(): Promise<CirclesDTO> {
  return createCirclesListMock();
}

export async function getMockCircleDTO(circleId: string): Promise<CircleEnrichedDTO> {
  return createCircleMock(circleId);
}

