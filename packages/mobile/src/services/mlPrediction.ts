// ML Prediction Service - Simple predictive models for scheduling
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MLPrediction, Activity, VoiceCommand } from '../types';

const ML_CACHE_KEY = 'ml_predictions';
const TRAINING_DATA_KEY = 'ml_training_data';

interface SchedulePattern {
  dayOfWeek: number;
  hourOfDay: number;
  taskType: string;
  frequency: number;
}

class MLPredictionService {
  private patterns: SchedulePattern[] = [];

  constructor() {
    this.loadTrainingData();
  }

  async loadTrainingData() {
    try {
      const data = await AsyncStorage.getItem(TRAINING_DATA_KEY);
      if (data) {
        this.patterns = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  }

  async saveTrainingData() {
    try {
      await AsyncStorage.setItem(TRAINING_DATA_KEY, JSON.stringify(this.patterns));
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }

  // Learn from user's voice commands and activities
  async learnFromActivity(activity: Activity | VoiceCommand) {
    const date = new Date(activity.timestamp);
    const dayOfWeek = date.getDay();
    const hourOfDay = date.getHours();

    // Extract task type
    let taskType = 'general';
    if ('transcript' in activity) {
      taskType = this.extractTaskType(activity.transcript);
    }

    // Update pattern frequency
    const existingPattern = this.patterns.find(
      (p) => p.dayOfWeek === dayOfWeek && p.hourOfDay === hourOfDay && p.taskType === taskType
    );

    if (existingPattern) {
      existingPattern.frequency++;
    } else {
      this.patterns.push({
        dayOfWeek,
        hourOfDay,
        taskType,
        frequency: 1,
      });
    }

    await this.saveTrainingData();
  }

  // Predict best time for scheduling a task
  async predictScheduleTime(taskType: string): Promise<MLPrediction> {
    const relevantPatterns = this.patterns.filter((p) => p.taskType === taskType);

    if (relevantPatterns.length === 0) {
      return {
        type: 'schedule_suggestion',
        confidence: 0.3,
        prediction: {
          suggestedTime: this.getDefaultTime(),
          reason: 'No historical data available',
        },
        factors: ['default_recommendation'],
      };
    }

    // Find most frequent time
    const sortedPatterns = relevantPatterns.sort((a, b) => b.frequency - a.frequency);
    const bestPattern = sortedPatterns[0];
    const totalFrequency = relevantPatterns.reduce((sum, p) => sum + p.frequency, 0);
    const confidence = Math.min(bestPattern.frequency / totalFrequency, 0.95);

    return {
      type: 'schedule_suggestion',
      confidence,
      prediction: {
        dayOfWeek: bestPattern.dayOfWeek,
        hourOfDay: bestPattern.hourOfDay,
        suggestedTime: this.formatTime(bestPattern.dayOfWeek, bestPattern.hourOfDay),
        reason: `You typically handle ${taskType} tasks at this time`,
      },
      factors: ['historical_patterns', 'frequency_analysis'],
    };
  }

  // Predict task priority based on patterns
  async predictTaskPriority(taskDescription: string): Promise<MLPrediction> {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'now', 'immediately'];
    const highPriorityKeywords = ['important', 'deadline', 'meeting', 'client', 'boss'];
    const lowPriorityKeywords = ['later', 'whenever', 'optional', 'maybe', 'someday'];

    const description = taskDescription.toLowerCase();
    let priority = 'medium';
    let confidence = 0.6;
    let factors: string[] = [];

    if (urgentKeywords.some((keyword) => description.includes(keyword))) {
      priority = 'urgent';
      confidence = 0.9;
      factors.push('urgent_keywords');
    } else if (highPriorityKeywords.some((keyword) => description.includes(keyword))) {
      priority = 'high';
      confidence = 0.8;
      factors.push('high_priority_keywords');
    } else if (lowPriorityKeywords.some((keyword) => description.includes(keyword))) {
      priority = 'low';
      confidence = 0.7;
      factors.push('low_priority_keywords');
    }

    return {
      type: 'task_priority',
      confidence,
      prediction: { priority },
      factors,
    };
  }

  // Estimate time required for a task
  async predictTimeEstimate(taskDescription: string): Promise<MLPrediction> {
    const taskType = this.extractTaskType(taskDescription);

    // Simple time estimates based on task type
    const timeEstimates: Record<string, number> = {
      email: 15,
      meeting: 60,
      call: 30,
      task: 45,
      research: 120,
      general: 30,
    };

    const estimatedMinutes = timeEstimates[taskType] || 30;
    const confidence = 0.7;

    return {
      type: 'time_estimate',
      confidence,
      prediction: {
        estimatedMinutes,
        range: {
          min: estimatedMinutes * 0.7,
          max: estimatedMinutes * 1.3,
        },
      },
      factors: ['task_type_analysis', 'historical_averages'],
    };
  }

  // Extract task type from text
  private extractTaskType(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('email') || lowerText.includes('mail')) return 'email';
    if (lowerText.includes('meeting') || lowerText.includes('schedule')) return 'meeting';
    if (lowerText.includes('call') || lowerText.includes('phone')) return 'call';
    if (lowerText.includes('research') || lowerText.includes('find')) return 'research';
    if (lowerText.includes('task') || lowerText.includes('todo')) return 'task';

    return 'general';
  }

  // Format time prediction
  private formatTime(dayOfWeek: number, hourOfDay: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const period = hourOfDay >= 12 ? 'PM' : 'AM';
    const hour = hourOfDay > 12 ? hourOfDay - 12 : hourOfDay === 0 ? 12 : hourOfDay;

    return `${days[dayOfWeek]}s at ${hour}:00 ${period}`;
  }

  // Get default scheduling time (9 AM on current day)
  private getDefaultTime(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    return this.formatTime(dayOfWeek, 9);
  }

  // Get productivity insights
  async getProductivityInsights(): Promise<any> {
    // Group patterns by time of day
    const morningPatterns = this.patterns.filter((p) => p.hourOfDay >= 6 && p.hourOfDay < 12);
    const afternoonPatterns = this.patterns.filter((p) => p.hourOfDay >= 12 && p.hourOfDay < 18);
    const eveningPatterns = this.patterns.filter((p) => p.hourOfDay >= 18 && p.hourOfDay < 24);

    const morningActivity = morningPatterns.reduce((sum, p) => sum + p.frequency, 0);
    const afternoonActivity = afternoonPatterns.reduce((sum, p) => sum + p.frequency, 0);
    const eveningActivity = eveningPatterns.reduce((sum, p) => sum + p.frequency, 0);

    const totalActivity = morningActivity + afternoonActivity + eveningActivity;

    let peakTime = 'morning';
    let maxActivity = morningActivity;

    if (afternoonActivity > maxActivity) {
      peakTime = 'afternoon';
      maxActivity = afternoonActivity;
    }
    if (eveningActivity > maxActivity) {
      peakTime = 'evening';
      maxActivity = eveningActivity;
    }

    return {
      peakProductivityTime: peakTime,
      activityDistribution: {
        morning: totalActivity > 0 ? (morningActivity / totalActivity) * 100 : 0,
        afternoon: totalActivity > 0 ? (afternoonActivity / totalActivity) * 100 : 0,
        evening: totalActivity > 0 ? (eveningActivity / totalActivity) * 100 : 0,
      },
      totalPatterns: this.patterns.length,
      mostCommonTasks: this.getMostCommonTasks(),
    };
  }

  private getMostCommonTasks(): Array<{ taskType: string; count: number }> {
    const taskCounts: Record<string, number> = {};

    this.patterns.forEach((pattern) => {
      taskCounts[pattern.taskType] = (taskCounts[pattern.taskType] || 0) + pattern.frequency;
    });

    return Object.entries(taskCounts)
      .map(([taskType, count]) => ({ taskType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Reset training data
  async resetTrainingData() {
    this.patterns = [];
    await AsyncStorage.removeItem(TRAINING_DATA_KEY);
  }
}

export default new MLPredictionService();
