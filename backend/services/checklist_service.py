"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Checklist Service

Description:
    This module provides the ChecklistService for business logic related
    to checklist templates, sections, items, and responses.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from .base_service import BaseService
from ..repositories.checklist_repository import (
    ChecklistRepository,
    ChecklistTemplateRepository,
    ChecklistSectionRepository,
    ChecklistItemRepository,
)
from ..database.models.checklist import (
    InspectionChecklist,
    ChecklistTemplate,
    ChecklistSection,
    ChecklistItem,
    InspectionDomain,
)


class ChecklistService(BaseService[InspectionChecklist, ChecklistRepository]):
    """
    Service for Checklist business logic.
    
    This service handles checklist template management, response processing,
    and compliance tracking.
    """
    
    def __init__(self, session: Session):
        """
        Initialize the checklist service.
        
        Args:
            session: The database session
        """
        checklist_repo = ChecklistRepository(InspectionChecklist, session)
        super().__init__(checklist_repo, session)
        self.template_repo = ChecklistTemplateRepository(ChecklistTemplate, session)
        self.section_repo = ChecklistSectionRepository(ChecklistSection, session)
        self.item_repo = ChecklistItemRepository(ChecklistItem, session)
    
    def get_template_by_code(self, code: str) -> Optional[ChecklistTemplate]:
        """
        Get a checklist template by code.
        
        Args:
            code: Template code
            
        Returns:
            Optional[ChecklistTemplate]: The template if found
        """
        return self.template_repo.find_by_code(code)
    
    def get_active_templates(self, domain: Optional[str] = None) -> List[ChecklistTemplate]:
        """
        Get all active checklist templates.
        
        Args:
            domain: Optional domain filter
            
        Returns:
            List[ChecklistTemplate]: List of active templates
        """
        return self.template_repo.find_active_templates(domain)
    
    def get_template_with_items(self, template_id: UUID) -> dict:
        """
        Get a template with all sections and items.
        
        Args:
            template_id: ID of the template
            
        Returns:
            dict: Template with sections and items
        """
        try:
            template = self.template_repo.get(template_id)
            if template is None:
                raise Exception(f"Template with id {template_id} not found")
            
            sections = self.section_repo.find_by_template(template_id)
            items = self.item_repo.find_by_template(template_id)
            
            return {
                "template": template.to_dict(),
                "sections": [s.to_dict() for s in sections],
                "items": [i.to_dict() for i in items],
            }
        except Exception as e:
            raise Exception(f"Error getting template with items: {str(e)}")
    
    def create_template(
        self,
        name: str,
        code: str,
        inspection_type_id: UUID,
        domain: str,
        description: Optional[str] = None,
        estimated_duration: Optional[int] = None
    ) -> ChecklistTemplate:
        """
        Create a new checklist template.
        
        Args:
            name: Template name
            code: Unique template code
            inspection_type_id: ID of the inspection type
            domain: Regulatory domain
            description: Template description
            estimated_duration: Estimated duration in minutes
            
        Returns:
            ChecklistTemplate: The created template
        """
        if domain not in InspectionDomain.all():
            raise ValueError(f"Domain must be one of {InspectionDomain.all()}")
        
        template = ChecklistTemplate(
            name=name,
            code=code,
            inspection_type_id=inspection_type_id,
            domain=domain,
            description=description,
            estimated_duration=estimated_duration,
            is_active=True
        )
        
        return self.template_repo.create(template)
    
    def add_section(
        self,
        template_id: UUID,
        name: str,
        code: str,
        description: Optional[str] = None,
        display_order: int = 0,
        is_required: bool = True
    ) -> ChecklistSection:
        """
        Add a section to a template.
        
        Args:
            template_id: ID of the template
            name: Section name
            code: Section code
            description: Section description
            display_order: Display order
            is_required: Whether section is required
            
        Returns:
            ChecklistSection: The created section
        """
        section = ChecklistSection(
            template_id=template_id,
            name=name,
            code=code,
            description=description,
            display_order=display_order,
            is_required=is_required
        )
        
        created_section = self.section_repo.create(section)
        
        # Update template item count
        self._update_template_item_count(template_id)
        
        return created_section
    
    def add_item(
        self,
        section_id: UUID,
        template_id: UUID,
        question_text: str,
        item_code: str,
        response_type: str,
        is_required: bool = True,
        requires_evidence: bool = False,
        evidence_types: Optional[List[str]] = None,
        regulatory_reference: Optional[str] = None,
        guidance_text: Optional[str] = None,
        default_value: Optional[str] = None,
        options: Optional[dict] = None,
        display_order: int = 0,
        severity_on_failure: Optional[str] = None
    ) -> ChecklistItem:
        """
        Add an item to a section.
        
        Args:
            section_id: ID of the section
            template_id: ID of the template
            question_text: Question text
            item_code: Item code
            response_type: Response type
            is_required: Whether item is required
            requires_evidence: Whether evidence is required
            evidence_types: Allowed evidence types
            regulatory_reference: Regulatory reference
            guidance_text: Guidance text
            default_value: Default value
            options: Options for dropdown/multiple_choice
            display_order: Display order
            severity_on_failure: Severity on failure
            
        Returns:
            ChecklistItem: The created item
        """
        item = ChecklistItem(
            section_id=section_id,
            template_id=template_id,
            question_text=question_text,
            item_code=item_code,
            response_type=response_type,
            is_required=is_required,
            requires_evidence=requires_evidence,
            evidence_types=evidence_types,
            regulatory_reference=regulatory_reference,
            guidance_text=guidance_text,
            default_value=default_value,
            options=options,
            display_order=display_order,
            severity_on_failure=severity_on_failure
        )
        
        created_item = self.item_repo.create(item)
        
        # Update template item count
        self._update_template_item_count(template_id)
        
        return created_item
    
    def create_responses(
        self,
        inspection_id: UUID,
        template_id: UUID,
        responses: List[dict]
    ) -> List[InspectionChecklist]:
        """
        Create checklist responses for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            template_id: ID of the template
            responses: List of response data
            
        Returns:
            List[InspectionChecklist]: List of created responses
        """
        checklist_responses = []
        
        for response_data in responses:
            response = InspectionChecklist(
                inspection_id=inspection_id,
                checklist_template_id=template_id,
                section_id=response_data.get("section_id"),
                item_id=response_data["item_id"],
                response_type=response_data.get("response_type", "text"),
                response_value=response_data.get("response_value"),
                response_text=response_data.get("response_text"),
                is_compliant=response_data.get("is_compliant"),
                requires_evidence=response_data.get("requires_evidence", False),
                evidence_attached=response_data.get("evidence_attached", False),
                notes=response_data.get("notes"),
                regulatory_reference=response_data.get("regulatory_reference"),
                severity=response_data.get("severity")
            )
            checklist_responses.append(response)
        
        return self.create_bulk(checklist_responses)
    
    def get_completion_percentage(self, inspection_id: UUID) -> float:
        """
        Calculate completion percentage for an inspection's checklist.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            float: Completion percentage (0-100)
        """
        return self.repository.get_completion_percentage(inspection_id)
    
    def get_non_compliant_responses(self, inspection_id: UUID) -> List[InspectionChecklist]:
        """
        Get all non-compliant responses for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[InspectionChecklist]: List of non-compliant responses
        """
        return self.repository.find_non_compliant(inspection_id)
    
    def get_responses_with_missing_evidence(self, inspection_id: UUID) -> List[InspectionChecklist]:
        """
        Get responses that require evidence but don't have it.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[InspectionChecklist]: List of responses with missing evidence
        """
        return self.repository.find_with_missing_evidence(inspection_id)
    
    def _update_template_item_count(self, template_id: UUID) -> None:
        """
        Update the total item count for a template.
        
        Args:
            template_id: ID of the template
        """
        try:
            items = self.item_repo.find_by_template(template_id)
            template = self.template_repo.get(template_id)
            if template:
                template.total_items = len(items)
                self.template_repo.update(template)
        except Exception:
            # Log error but don't fail the main operation
            pass
    
    def validate_before_create(self, entity: InspectionChecklist) -> None:
        """
        Validate checklist response before creation.
        
        Args:
            entity: The checklist response to validate
            
        Raises:
            ValueError: If validation fails
        """
        # Validate that evidence is attached if required
        if entity.requires_evidence and not entity.evidence_attached:
            raise ValueError("Evidence is required for this item but not attached")
        
        # Validate compliance status is set
        if entity.is_compliant is None:
            raise ValueError("Compliance status must be set")
