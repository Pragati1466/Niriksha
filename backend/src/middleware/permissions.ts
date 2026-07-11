// Role-Based Permissions Middleware
import { Request, Response, NextFunction } from 'express'
import prisma from '../utils/prisma'

export enum Permission {
  // User Management
  CREATE_USER = 'CREATE_USER',
  READ_USER = 'READ_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  
  // Inspection Management
  CREATE_INSPECTION = 'CREATE_INSPECTION',
  READ_INSPECTION = 'READ_INSPECTION',
  UPDATE_INSPECTION = 'UPDATE_INSPECTION',
  DELETE_INSPECTION = 'DELETE_INSPECTION',
  ASSIGN_INSPECTION = 'ASSIGN_INSPECTION',
  
  // Violation Management
  CREATE_VIOLATION = 'CREATE_VIOLATION',
  READ_VIOLATION = 'READ_VIOLATION',
  UPDATE_VIOLATION = 'UPDATE_VIOLATION',
  DELETE_VIOLATION = 'DELETE_VIOLATION',
  
  // Review Management
  CREATE_REVIEW = 'CREATE_REVIEW',
  READ_REVIEW = 'READ_REVIEW',
  UPDATE_REVIEW = 'UPDATE_REVIEW',
  DELETE_REVIEW = 'DELETE_REVIEW',
  
  // Report Management
  GENERATE_REPORT = 'GENERATE_REPORT',
  READ_REPORT = 'READ_REPORT',
  
  // Department Management
  CREATE_DEPARTMENT = 'CREATE_DEPARTMENT',
  READ_DEPARTMENT = 'READ_DEPARTMENT',
  UPDATE_DEPARTMENT = 'UPDATE_DEPARTMENT',
  DELETE_DEPARTMENT = 'DELETE_DEPARTMENT',
  
  // Site Management
  CREATE_SITE = 'CREATE_SITE',
  READ_SITE = 'READ_SITE',
  UPDATE_SITE = 'UPDATE_SITE',
  DELETE_SITE = 'DELETE_SITE',
  
  // Template Management
  CREATE_TEMPLATE = 'CREATE_TEMPLATE',
  READ_TEMPLATE = 'READ_TEMPLATE',
  UPDATE_TEMPLATE = 'UPDATE_TEMPLATE',
  DELETE_TEMPLATE = 'DELETE_TEMPLATE',
  
  // System Administration
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_PERMISSIONS = 'MANAGE_PERMISSIONS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  EXPORT_DATA = 'EXPORT_DATA',
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
}

// Role-Permission Mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    // Full access to everything
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.CREATE_INSPECTION,
    Permission.READ_INSPECTION,
    Permission.UPDATE_INSPECTION,
    Permission.DELETE_INSPECTION,
    Permission.ASSIGN_INSPECTION,
    Permission.CREATE_VIOLATION,
    Permission.READ_VIOLATION,
    Permission.UPDATE_VIOLATION,
    Permission.DELETE_VIOLATION,
    Permission.CREATE_REVIEW,
    Permission.READ_REVIEW,
    Permission.UPDATE_REVIEW,
    Permission.DELETE_REVIEW,
    Permission.GENERATE_REPORT,
    Permission.READ_REPORT,
    Permission.CREATE_DEPARTMENT,
    Permission.READ_DEPARTMENT,
    Permission.UPDATE_DEPARTMENT,
    Permission.DELETE_DEPARTMENT,
    Permission.CREATE_SITE,
    Permission.READ_SITE,
    Permission.UPDATE_SITE,
    Permission.DELETE_SITE,
    Permission.CREATE_TEMPLATE,
    Permission.READ_TEMPLATE,
    Permission.UPDATE_TEMPLATE,
    Permission.DELETE_TEMPLATE,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_PERMISSIONS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_DATA,
    Permission.MANAGE_SYSTEM,
  ],
  
  SUPERVISOR: [
    // Can manage inspections, reviews, and reports
    Permission.READ_USER,
    Permission.CREATE_INSPECTION,
    Permission.READ_INSPECTION,
    Permission.UPDATE_INSPECTION,
    Permission.ASSIGN_INSPECTION,
    Permission.CREATE_VIOLATION,
    Permission.READ_VIOLATION,
    Permission.UPDATE_VIOLATION,
    Permission.CREATE_REVIEW,
    Permission.READ_REVIEW,
    Permission.UPDATE_REVIEW,
    Permission.GENERATE_REPORT,
    Permission.READ_REPORT,
    Permission.READ_DEPARTMENT,
    Permission.READ_SITE,
    Permission.READ_TEMPLATE,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_DATA,
  ],
  
  INSPECTOR: [
    // Can perform inspections and create violations
    Permission.READ_USER,
    Permission.READ_INSPECTION,
    Permission.UPDATE_INSPECTION,
    Permission.CREATE_VIOLATION,
    Permission.READ_VIOLATION,
    Permission.UPDATE_VIOLATION,
    Permission.READ_REPORT,
    Permission.READ_DEPARTMENT,
    Permission.READ_SITE,
    Permission.READ_TEMPLATE,
  ],
  
  VIEWER: [
    // Read-only access
    Permission.READ_USER,
    Permission.READ_INSPECTION,
    Permission.READ_VIOLATION,
    Permission.READ_REVIEW,
    Permission.READ_REPORT,
    Permission.READ_DEPARTMENT,
    Permission.READ_SITE,
    Permission.READ_TEMPLATE,
  ],
}

// Check if user has permission
export const hasPermission = (userRole: string, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(permission)
}

// Check if user has any of the specified permissions
export const hasAnyPermission = (userRole: string, permissions: Permission[]): boolean => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.some(permission => userPermissions.includes(permission))
}

// Check if user has all of the specified permissions
export const hasAllPermissions = (userRole: string, permissions: Permission[]): boolean => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.every(permission => userPermissions.includes(permission))
}

// Middleware to check single permission
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      if (!hasPermission(user.role, permission)) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `Permission required: ${permission}`
        })
      }
      
      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Middleware to check any of multiple permissions
export const requireAnyPermission = (permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      if (!hasAnyPermission(user.role, permissions)) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `One of these permissions required: ${permissions.join(', ')}`
        })
      }
      
      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Middleware to check all of multiple permissions
export const requireAllPermissions = (permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      if (!hasAllPermissions(user.role, permissions)) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `All these permissions required: ${permissions.join(', ')}`
        })
      }
      
      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Middleware to check role
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `One of these roles required: ${roles.join(', ')}`
        })
      }
      
      next()
    } catch (error) {
      console.error('Role check error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Get user permissions
export const getUserPermissions = (userRole: string): Permission[] => {
  return ROLE_PERMISSIONS[userRole] || []
}

// Check resource ownership (for inspectors only viewing their own inspections)
export const checkResourceOwnership = async (
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> => {
  try {
    switch (resourceType) {
      case 'inspection':
        const inspection = await prisma.inspection.findUnique({
          where: { id: resourceId },
          select: { inspectorId: true },
        })
        return inspection?.inspectorId === userId
        
      case 'violation':
        const violation = await prisma.violation.findUnique({
          where: { id: resourceId },
          include: { inspection: true },
        })
        return violation?.inspection.inspectorId === userId
        
      case 'review':
        const review = await prisma.review.findUnique({
          where: { id: resourceId },
          select: { reviewerId: true },
        })
        return review?.reviewerId === userId
        
      default:
        return false
    }
  } catch (error) {
    console.error('Resource ownership check error:', error)
    return false
  }
}

// Middleware to check resource ownership or admin access
export const requireOwnershipOrAdmin = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user
      const resourceId = req.params.id
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      // Admins can access everything
      if (user.role === 'ADMIN') {
        return next()
      }
      
      // Check ownership
      const isOwner = await checkResourceOwnership(user.id, resourceType, resourceId)
      
      if (!isOwner) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to access this resource'
        })
      }
      
      next()
    } catch (error) {
      console.error('Ownership check error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Department-based access control
export const checkDepartmentAccess = async (
  userId: string,
  departmentId: string
): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, departmentId: true },
    })
    
    if (!user) return false
    
    // Admins can access all departments
    if (user.role === 'ADMIN') return true
    
    // Users can access their own department
    return user.departmentId === departmentId
  } catch (error) {
    console.error('Department access check error:', error)
    return false
  }
}

// Middleware for department-based access
export const requireDepartmentAccess = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user
      const departmentId = req.params.departmentId || req.body.departmentId
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      if (!departmentId) {
        return next() // No department restriction
      }
      
      const hasAccess = await checkDepartmentAccess(user.id, departmentId)
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to access this department'
        })
      }
      
      next()
    } catch (error) {
      console.error('Department access check error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
