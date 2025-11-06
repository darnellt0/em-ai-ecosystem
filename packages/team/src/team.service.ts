/**
 * Team Collaboration Service - Phase 4 (Agent 12)
 * Shared calendar management, team task coordination, collaborative scheduling
 */

import { userService } from '../../api/src/services/user.service';
import { calendarService } from '../../api/src/services/calendar.service';

export interface TeamCalendar {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[]; // User IDs
  visibility: 'public' | 'team' | 'private';
  color?: string;
  createdAt: Date;
}

export interface TeamTask {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  assignedTo: string[]; // User IDs
  createdBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  dependencies: string[]; // Task IDs
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMeetingRequest {
  title: string;
  duration: number; // minutes
  attendees: string[]; // User IDs
  requiredAttendees: string[]; // Must attend
  optionalAttendees: string[]; // Can attend
  constraints?: {
    earliestStart?: Date;
    latestEnd?: Date;
    preferredDays?: number[]; // 0-6
    avoidDays?: number[];
  };
}

export interface MeetingProposal {
  proposedTime: Date;
  attendeeAvailability: Record<string, boolean>; // userId -> available
  conflictCount: number;
  score: number; // 0-100, higher is better
}

class TeamService {
  private logger = console;
  private teamCalendars: Map<string, TeamCalendar> = new Map();
  private teamTasks: Map<string, TeamTask> = new Map();

  /**
   * Create team calendar
   */
  async createTeamCalendar(
    organizationId: string,
    name: string,
    ownerId: string,
    options?: { description?: string; visibility?: TeamCalendar['visibility'] }
  ): Promise<TeamCalendar> {
    this.logger.info(`[Team Service] Creating team calendar: ${name}`);

    try {
      const calendarId = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const calendar: TeamCalendar = {
        id: calendarId,
        organizationId,
        name,
        description: options?.description,
        ownerId,
        members: [ownerId],
        visibility: options?.visibility || 'team',
        createdAt: new Date(),
      };

      this.teamCalendars.set(calendarId, calendar);

      this.logger.info(`[Team Service] Created team calendar: ${calendarId}`);

      return calendar;
    } catch (error) {
      this.logger.error('[Team Service] Create calendar error:', error);
      throw error;
    }
  }

  /**
   * Add member to team calendar
   */
  async addCalendarMember(calendarId: string, userId: string): Promise<boolean> {
    this.logger.info(`[Team Service] Adding member ${userId} to calendar ${calendarId}`);

    try {
      const calendar = this.teamCalendars.get(calendarId);
      if (!calendar) {
        return false;
      }

      if (!calendar.members.includes(userId)) {
        calendar.members.push(userId);
      }

      return true;
    } catch (error) {
      this.logger.error('[Team Service] Add member error:', error);
      return false;
    }
  }

  /**
   * Create team task
   */
  async createTeamTask(
    organizationId: string,
    title: string,
    createdBy: string,
    options?: {
      description?: string;
      assignedTo?: string[];
      priority?: TeamTask['priority'];
      dueDate?: Date;
      tags?: string[];
    }
  ): Promise<TeamTask> {
    this.logger.info(`[Team Service] Creating team task: ${title}`);

    try {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const task: TeamTask = {
        id: taskId,
        organizationId,
        title,
        description: options?.description,
        assignedTo: options?.assignedTo || [],
        createdBy,
        status: 'pending',
        priority: options?.priority || 'medium',
        dueDate: options?.dueDate,
        dependencies: [],
        tags: options?.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.teamTasks.set(taskId, task);

      this.logger.info(`[Team Service] Created team task: ${taskId}`);

      return task;
    } catch (error) {
      this.logger.error('[Team Service] Create task error:', error);
      throw error;
    }
  }

  /**
   * Assign task to team member
   */
  async assignTask(taskId: string, userId: string): Promise<boolean> {
    this.logger.info(`[Team Service] Assigning task ${taskId} to ${userId}`);

    try {
      const task = this.teamTasks.get(taskId);
      if (!task) {
        return false;
      }

      if (!task.assignedTo.includes(userId)) {
        task.assignedTo.push(userId);
        task.updatedAt = new Date();
      }

      return true;
    } catch (error) {
      this.logger.error('[Team Service] Assign task error:', error);
      return false;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    status: TeamTask['status']
  ): Promise<TeamTask | null> {
    this.logger.info(`[Team Service] Updating task ${taskId} status to ${status}`);

    try {
      const task = this.teamTasks.get(taskId);
      if (!task) {
        return null;
      }

      task.status = status;
      task.updatedAt = new Date();

      return task;
    } catch (error) {
      this.logger.error('[Team Service] Update status error:', error);
      return null;
    }
  }

  /**
   * Find optimal meeting time for team
   */
  async findTeamMeetingTime(
    organizationId: string,
    request: TeamMeetingRequest
  ): Promise<MeetingProposal[]> {
    this.logger.info(`[Team Service] Finding optimal meeting time for ${request.attendees.length} attendees`);

    try {
      const proposals: MeetingProposal[] = [];

      // Get calendar availability for all attendees
      const attendeeCalendars = new Map<string, any>();
      for (const userId of request.attendees) {
        const user = await userService.getUserById(userId);
        if (user && user.email) {
          // Would fetch calendar events for user
          attendeeCalendars.set(userId, []);
        }
      }

      // Generate time slot proposals
      const now = new Date();
      const searchEnd = new Date();
      searchEnd.setDate(searchEnd.getDate() + 7);

      // Simplified: generate a few proposals
      for (let i = 1; i <= 3; i++) {
        const proposedTime = new Date(now);
        proposedTime.setDate(proposedTime.getDate() + i);
        proposedTime.setHours(10 + i * 2, 0, 0, 0); // 10am, 12pm, 2pm

        const availability: Record<string, boolean> = {};
        for (const userId of request.attendees) {
          // Check if user is available (simplified)
          availability[userId] = true; // Would check actual calendar
        }

        const conflictCount = Object.values(availability).filter((v) => !v).length;
        const score = ((request.attendees.length - conflictCount) / request.attendees.length) * 100;

        proposals.push({
          proposedTime,
          attendeeAvailability: availability,
          conflictCount,
          score: Math.round(score),
        });
      }

      // Sort by score (highest first)
      proposals.sort((a, b) => b.score - a.score);

      return proposals;
    } catch (error) {
      this.logger.error('[Team Service] Find meeting time error:', error);
      return [];
    }
  }

  /**
   * Get team tasks for organization
   */
  async getTeamTasks(
    organizationId: string,
    filters?: {
      assignedTo?: string;
      status?: TeamTask['status'];
      priority?: TeamTask['priority'];
    }
  ): Promise<TeamTask[]> {
    this.logger.info(`[Team Service] Getting team tasks for org ${organizationId}`);

    try {
      let tasks: TeamTask[] = Array.from(this.teamTasks.values()).filter(
        (task) => task.organizationId === organizationId
      );

      // Apply filters
      if (filters?.assignedTo) {
        tasks = tasks.filter((task) => task.assignedTo.includes(filters.assignedTo!));
      }

      if (filters?.status) {
        tasks = tasks.filter((task) => task.status === filters.status);
      }

      if (filters?.priority) {
        tasks = tasks.filter((task) => task.priority === filters.priority);
      }

      // Sort by priority and due date
      tasks.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

        if (priorityDiff !== 0) return priorityDiff;

        // Then by due date
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }

        return 0;
      });

      return tasks;
    } catch (error) {
      this.logger.error('[Team Service] Get tasks error:', error);
      return [];
    }
  }

  /**
   * Get team calendars for organization
   */
  async getTeamCalendars(organizationId: string): Promise<TeamCalendar[]> {
    this.logger.info(`[Team Service] Getting team calendars for org ${organizationId}`);

    try {
      return Array.from(this.teamCalendars.values()).filter(
        (calendar) => calendar.organizationId === organizationId
      );
    } catch (error) {
      this.logger.error('[Team Service] Get calendars error:', error);
      return [];
    }
  }

  /**
   * Send team notification
   */
  async sendTeamNotification(
    organizationId: string,
    recipientIds: string[],
    message: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<boolean> {
    this.logger.info(`[Team Service] Sending notification to ${recipientIds.length} team members`);

    try {
      // Would integrate with email/Slack services
      for (const userId of recipientIds) {
        const user = await userService.getUserById(userId);
        if (user) {
          this.logger.info(`[Team Service] Would notify ${user.email}: ${message}`);
          // await emailService.sendNotification(user.email, 'Team Update', message);
          // await slackService.sendMessage(user.slack_user_id, message);
        }
      }

      return true;
    } catch (error) {
      this.logger.error('[Team Service] Send notification error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const teamService = new TeamService();
