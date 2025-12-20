/**
 * Reports API endpoints
 * 
 * Aligned with OpenAPI specification:
 * - POST /reports (operationId: ReportController_createReport)
 * - GET /reports (operationId: ReportController_getAllReports) - Admin only
 * - GET /reports/{id} (operationId: ReportController_getReport) - Admin only
 * - PATCH /reports/{id}/status (operationId: ReportController_updateReportStatus) - Admin only
 * - GET /reports/user/{userId} (operationId: ReportController_getReportsByUser)
 * - GET /reports/store/{storeId} (operationId: ReportController_getReportsByStore)
 */

import { getApiClient } from "../client";
import type {
    CreateReportDto,
    ReportResponseDto,
    UpdateReportStatusDto,
} from "../types/swagger";

// Re-export Swagger types for convenience
export type {
    CreateReportDto,
    ReportResponseDto,
    UpdateReportStatusDto
};

export interface GetAllReportsParams {
  skip?: number; // Number of records to skip for pagination
  take?: number; // Number of records to return
  status?: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED"; // Filter by report status
  [key: string]: string | number | boolean | undefined;
}

export interface GetReportsByUserParams {
  skip?: number; // Number of records to skip for pagination
  take?: number; // Number of records to return
  type?: "submitted" | "received"; // Type of reports: 'submitted' for reports by user, 'received' for reports about user. Defaults to 'submitted'.
  [key: string]: string | number | boolean | undefined;
}

export interface GetReportsByStoreParams {
  skip?: number; // Number of records to skip for pagination
  take?: number; // Number of records to return
  [key: string]: string | number | boolean | undefined;
}

export const reportsApi = {
  /**
   * Creates a new report against a user (consumer) or store (retailer)
   * Users cannot report themselves or their own stores
   * Operation: ReportController_createReport
   * Endpoint: POST /reports
   */
  createReport: (data: CreateReportDto): Promise<ReportResponseDto> => {
    return getApiClient().post<ReportResponseDto>("/reports", data);
  },

  /**
   * Retrieves all reports with pagination
   * Optionally filtered by status
   * Admin access only
   * Operation: ReportController_getAllReports
   * Endpoint: GET /reports
   */
  getAllReports: (params?: GetAllReportsParams): Promise<ReportResponseDto[]> => {
    return getApiClient().get<ReportResponseDto[]>("/reports", params);
  },

  /**
   * Retrieves a single report by ID
   * Admin access only
   * Operation: ReportController_getReport
   * Endpoint: GET /reports/{id}
   */
  getReport: (reportId: number): Promise<ReportResponseDto> => {
    return getApiClient().get<ReportResponseDto>(`/reports/${reportId}`);
  },

  /**
   * Updates the status of a report
   * Admin access only
   * Operation: ReportController_updateReportStatus
   * Endpoint: PATCH /reports/{id}/status
   */
  updateReportStatus: (
    reportId: number,
    data: UpdateReportStatusDto
  ): Promise<ReportResponseDto> => {
    return getApiClient().patch<ReportResponseDto>(
      `/reports/${reportId}/status`,
      data
    );
  },

  /**
   * Retrieves all reports for a specific user
   * Admins can view any user's reports, users can only view their own reports
   * Operation: ReportController_getReportsByUser
   * Endpoint: GET /reports/user/{userId}
   */
  getReportsByUser: (
    userId: number,
    params?: GetReportsByUserParams
  ): Promise<ReportResponseDto[]> => {
    return getApiClient().get<ReportResponseDto[]>(
      `/reports/user/${userId}`,
      params
    );
  },

  /**
   * Retrieves all reports for a specific store
   * Admins can view any store's reports, store owners can view their own store's reports
   * Operation: ReportController_getReportsByStore
   * Endpoint: GET /reports/store/{storeId}
   */
  getReportsByStore: (
    storeId: number,
    params?: GetReportsByStoreParams
  ): Promise<ReportResponseDto[]> => {
    return getApiClient().get<ReportResponseDto[]>(
      `/reports/store/${storeId}`,
      params
    );
  },
};
