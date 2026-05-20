import axios from 'axios';
import { TestSession, Test, CreateTestSessionRequest, CreateTestRequest } from '../../domain/entities/TestSession';
import { TestSessionRepository, TestRepository } from '../../domain/usecases/TestSessionUseCases';

const API_URL = process.env.NODE_ENV === 'development' 
  ? '' 
  : (process.env.REACT_APP_API_URL || "https://backend-java-pkn3.onrender.com");

export class TestSessionAPI implements TestSessionRepository {
  async getAll(): Promise<TestSession[]> {
    const response = await axios.get(`${API_URL}/test-sessions/`);
    return response.data;
  }

  async getById(id: number): Promise<TestSession> {
    const response = await axios.get(`${API_URL}/test-sessions/${id}`);
    return response.data;
  }

  async create(data: CreateTestSessionRequest): Promise<TestSession> {
    const response = await axios.post(`${API_URL}/test-sessions/`, data);
    return response.data;
  }

  async update(id: number, data: Partial<TestSession>): Promise<TestSession> {
    const response = await axios.put(`${API_URL}/test-sessions/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/test-sessions/${id}`);
  }

  async getTestsBySession(sessionId: number): Promise<Test[]> {
    const response = await axios.get(`${API_URL}/tests/?session_id=${sessionId}`);
    return response.data;
  }
}

export class TestAPI implements TestRepository {
  async getAll(): Promise<Test[]> {
    const response = await axios.get(`${API_URL}/tests/`);
    return response.data;
  }

  async getById(id: number): Promise<Test> {
    const response = await axios.get(`${API_URL}/tests/${id}`);
    return response.data;
  }

  async create(data: CreateTestRequest): Promise<Test> {
    const response = await axios.post(`${API_URL}/tests/`, data);
    return response.data;
  }

  async update(id: number, data: Partial<Test>): Promise<Test> {
    const response = await axios.put(`${API_URL}/tests/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/tests/${id}`);
  }
}

// Legacy compatibility exports
export const testSessionsAPI = new TestSessionAPI();
export const testsAPI = new TestAPI();
