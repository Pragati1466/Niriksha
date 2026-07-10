"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Checklist Repository

Description:
    This module provides the ChecklistRepository for performing database
    operations specific to checklist-related models, including templates,
    sections, items, and responses.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from .base_repository import BaseRepository
from ..database.models.checklist import (
    InspectionChecklist,
    ChecklistTemplate,
    ChecklistSection,
    ChecklistItem,
    InspectionDomain,
)


class ChecklistRepository(BaseRepository[InspectionChecklist]):
    """
    Repository for InspectionChecklist model with specialized queries.
    
    This repository provides methods for querying checklist responses
    by inspection, template, section, and compliance status.
    """
    
    def find_by_inspection(self, inspection_id: UUID) -> List[InspectionChecklist]:
        """
        Find all checklist responses for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[InspectionChecklist]: List of checklist responses
        """
        return self.find_by_field("inspection_id", inspection_id)
    
    def find_by_template(self, template_id: UUID) -> List[InspectionChecklist]:
        """
        Find all checklist responses for a template.
        
        Args:
            template_id: ID of the checklist template
            
        Returns:
            List[InspectionChecklist]: List of checklist responses
        """
        return self.find_by_field("checklist_template_id", template_id)
    
    def find_by_section(self, section_id: UUID) -> List[InspectionChecklist]:
        """
        Find all checklist responses for a section.
        
        Args:
            section_id: ID of the checklist section
            
        Returns:
            List[InspectionChecklist]: List of checklist responses
        """
        return self.find_by_field("section_id", section_id)
    
    def find_by_item(self, item_id: UUID) -> List[InspectionChecklist]:
        """
        Find all checklist responses for a specific item.
        
        Args:
            item_id: ID of the checklist item
            
        Returns:
            List[InspectionChecklist]: List of checklist responses
        """
        return self.find_by_field("item_id", item_id)
    
    def find_non_compliant(self, inspection_id: UUID) -> List[InspectionChecklist]:
        """
        Find all non-compliant checklist responses for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[InspectionChecklist]: List of non-compliant responses
        """
        try:
            all_responses = self.find_by_inspection(inspection_id)
            return [r for r in all_responses if r.is_compliant is False]
        except Exception as e:
            raise Exception(f"Error finding non-compliant responses: {str(e)}")
    
    def find_with_missing_evidence(self, inspection_id: UUID) -> List[InspectionChecklist]:
        """
        Find checklist responses that require evidence but don't have it.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[InspectionChecklist]: List of responses with missing evidence
        """
        try:
            all_responses = self.find_by_inspection(inspection_id)
            return [r for r in all_responses if r.requires_evidence and not r.evidence_attached]
        except Exception as e:
            raise Exception(f"Error finding responses with missing evidence: {str(e)}")
    
    def get_completion_percentage(self, inspection_id: UUID) -> float:
        """
        Calculate completion percentage for an inspection's checklist.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            float: Completion percentage (0-100)
        """
        try:
            all_responses = self.find_by_inspection(inspection_id)
            if not all_responses:
                return 0.0
            
            completed = sum(1 for r in all_responses if r.is_complete())
            return (completed / len(all_responses)) * 100
        except Exception as e:
            raise Exception(f"Error calculating completion percentage: {str(e)}")


class ChecklistTemplateRepository(BaseRepository[ChecklistTemplate]):
    """
    Repository for ChecklistTemplate model with specialized queries.
    
    This repository provides methods for querying checklist templates
    by domain, inspection type, and active status.
    """
    
    def find_active_templates(self, domain: Optional[str] = None) -> List[ChecklistTemplate]:
        """
        Find all active checklist templates, optionally filtered by domain.
        
        Args:
            domain: Optional domain filter
            
        Returns:
            List[ChecklistTemplate]: List of active templates
        """
        filters = {"is_active": True}
        if domain:
            filters["domain"] = domain
        
        return self.get_all(filters=filters)
    
    def find_by_code(self, code: str) -> Optional[ChecklistTemplate]:
        """
        Find a template by its unique code.
        
        Args:
            code: Template code
            
        Returns:
            Optional[ChecklistTemplate]: The template if found, None otherwise
        """
        try:
            results = self.find_by_field("code", code)
            return results[0] if results else None
        except Exception as e:
            raise Exception(f"Error finding template by code: {str(e)}")
    
    def find_by_domain(self, domain: str) -> List[ChecklistTemplate]:
        """
        Find all templates for a specific domain.
        
        Args:
            domain: Domain to filter by
            
        Returns:
            List[ChecklistTemplate]: List of templates
        """
        return self.find_by_field("domain", domain)
    
    def find_by_version(self, template_id: UUID, version: int) -> Optional[ChecklistTemplate]:
        """
        Find a template by ID and version.
        
        Args:
            template_id: ID of the template
            version: Version number
            
        Returns:
            Optional[ChecklistTemplate]: The template if found, None otherwise
        """
        try:
            filters = {"id": template_id, "version": version}
            results = self.find_by_fields(filters)
            return results[0] if results else None
        except Exception as e:
            raise Exception(f"Error finding template by version: {str(e)}")


class ChecklistSectionRepository(BaseRepository[ChecklistSection]):
    """
    Repository for ChecklistSection model with specialized queries.
    
    This repository provides methods for querying checklist sections
    by template and display order.
    """
    
    def find_by_template(self, template_id: UUID) -> List[ChecklistSection]:
        """
        Find all sections for a template, ordered by display order.
        
        Args:
            template_id: ID of the template
            
        Returns:
            List[ChecklistSection]: List of sections
        """
        try:
            sections = self.find_by_field("template_id", template_id)
            # Sort by display_order
            return sorted(sections, key=lambda s: s.display_order)
        except Exception as e:
            raise Exception(f"Error finding sections by template: {str(e)}")


class ChecklistItemRepository(BaseRepository[ChecklistItem]):
    """
    Repository for ChecklistItem model with specialized queries.
    
    This repository provides methods for querying checklist items
    by section, template, and code.
    """
    
    def find_by_section(self, section_id: UUID) -> List[ChecklistItem]:
        """
        Find all items for a section, ordered by display order.
        
        Args:
            section_id: ID of the section
            
        Returns:
            List[ChecklistItem]: List of items
        """
        try:
            items = self.find_by_field("section_id", section_id)
            # Sort by display_order
            return sorted(items, key=lambda i: i.display_order)
        except Exception as e:
            raise Exception(f"Error finding items by section: {str(e)}")
    
    def find_by_template(self, template_id: UUID) -> List[ChecklistItem]:
        """
        Find all items for a template.
        
        Args:
            template_id: ID of the template
            
        Returns:
            List[ChecklistItem]: List of items
        """
        return self.find_by_field("template_id", template_id)
    
    def find_by_code(self, item_code: str) -> Optional[ChecklistItem]:
        """
        Find an item by its code.
        
        Args:
            item_code: Item code
            
        Returns:
            Optional[ChecklistItem]: The item if found, None otherwise
        """
        try:
            results = self.find_by_field("item_code", item_code)
            return results[0] if results else None
        except Exception as e:
            raise Exception(f"Error finding item by code: {str(e)}")
    
    def find_required_items(self, template_id: UUID) -> List[ChecklistItem]:
        """
        Find all required items for a template.
        
        Args:
            template_id: ID of the template
            
        Returns:
            List[ChecklistItem]: List of required items
        """
        try:
            all_items = self.find_by_template(template_id)
            return [i for i in all_items if i.is_required]
        except Exception as e:
            raise Exception(f"Error finding required items: {str(e)}")
    
    def find_items_requiring_evidence(self, template_id: UUID) -> List[ChecklistItem]:
        """
        Find all items that require evidence for a template.
        
        Args:
            template_id: ID of the template
            
        Returns:
            List[ChecklistItem]: List of items requiring evidence
        """
        try:
            all_items = self.find_by_template(template_id)
            return [i for i in all_items if i.requires_evidence]
        except Exception as e:
            raise Exception(f"Error finding items requiring evidence: {str(e)}")
