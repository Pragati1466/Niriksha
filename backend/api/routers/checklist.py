"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Checklist API Router

Description:
    This module provides FastAPI router for checklist-related endpoints,
    including templates, sections, items, and responses.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas.checklist import (
    ChecklistResponseCreateRequest,
    ChecklistResponseUpdateRequest,
    ChecklistTemplateResponse,
    ChecklistItemResponse,
    ChecklistSectionResponse,
    ChecklistFullTemplateResponse,
)
from ..schemas.common import PaginationParams
from ..services.checklist_service import ChecklistService
from ..database.session import get_db


router = APIRouter(prefix="/checklists", tags=["checklists"])


@router.post("/templates", response_model=ChecklistTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    name: str,
    code: str,
    inspection_type_id: UUID,
    domain: str,
    description: Optional[str] = None,
    estimated_duration: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Create a new checklist template.
    
    Args:
        name: Template name
        code: Unique template code
        inspection_type_id: ID of the inspection type
        domain: Regulatory domain
        description: Template description
        estimated_duration: Estimated duration in minutes
        db: Database session
        
    Returns:
        ChecklistTemplateResponse: The created template
    """
    try:
        service = ChecklistService(db)
        template = service.create_template(
            name=name,
            code=code,
            inspection_type_id=inspection_type_id,
            domain=domain,
            description=description,
            estimated_duration=estimated_duration
        )
        return template
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/templates", response_model=list[ChecklistTemplateResponse])
def list_templates(
    domain: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all active checklist templates.
    
    Args:
        domain: Optional domain filter
        db: Database session
        
    Returns:
        List[ChecklistTemplateResponse]: List of templates
    """
    try:
        service = ChecklistService(db)
        templates = service.get_active_templates(domain)
        return templates
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/templates/{template_id}", response_model=ChecklistFullTemplateResponse)
def get_template_with_items(
    template_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a template with all sections and items.
    
    Args:
        template_id: ID of the template
        db: Database session
        
    Returns:
        ChecklistFullTemplateResponse: Template with sections and items
    """
    try:
        service = ChecklistService(db)
        template_data = service.get_template_with_items(template_id)
        return template_data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/templates/code/{code}", response_model=ChecklistTemplateResponse)
def get_template_by_code(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Get a template by code.
    
    Args:
        code: Template code
        db: Database session
        
    Returns:
        ChecklistTemplateResponse: The template
    """
    try:
        service = ChecklistService(db)
        template = service.get_template_by_code(code)
        if template is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/templates/{template_id}/sections", response_model=ChecklistSectionResponse, status_code=status.HTTP_201_CREATED)
def add_section(
    template_id: UUID,
    name: str,
    code: str,
    description: Optional[str] = None,
    display_order: int = 0,
    is_required: bool = True,
    db: Session = Depends(get_db)
):
    """
    Add a section to a template.
    
    Args:
        template_id: ID of the template
        name: Section name
        code: Section code
        description: Section description
        display_order: Display order
        is_required: Whether section is required
        db: Database session
        
    Returns:
        ChecklistSectionResponse: The created section
    """
    try:
        service = ChecklistService(db)
        section = service.add_section(
            template_id=template_id,
            name=name,
            code=code,
            description=description,
            display_order=display_order,
            is_required=is_required
        )
        return section
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/sections/{section_id}/items", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
def add_item(
    section_id: UUID,
    template_id: UUID,
    question_text: str,
    item_code: str,
    response_type: str,
    is_required: bool = True,
    requires_evidence: bool = False,
    evidence_types: Optional[list[str]] = None,
    regulatory_reference: Optional[str] = None,
    guidance_text: Optional[str] = None,
    default_value: Optional[str] = None,
    options: Optional[dict] = None,
    display_order: int = 0,
    severity_on_failure: Optional[str] = None,
    db: Session = Depends(get_db)
):
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
        db: Database session
        
    Returns:
        ChecklistItemResponse: The created item
    """
    try:
        service = ChecklistService(db)
        item = service.add_item(
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
        return item
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/responses", response_model=list, status_code=status.HTTP_201_CREATED)
def create_responses(
    request: ChecklistResponseCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create checklist responses for an inspection.
    
    Args:
        request: Response creation request
        db: Database session
        
    Returns:
        List: List of created responses
    """
    try:
        service = ChecklistService(db)
        responses = service.create_responses(
            inspection_id=request.inspection_id,
            template_id=request.checklist_template_id,
            responses=request.responses
        )
        return responses
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/responses/{response_id}", response_model=dict)
def get_response(
    response_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a checklist response by ID.
    
    Args:
        response_id: ID of the response
        db: Database session
        
    Returns:
        dict: The response
    """
    try:
        service = ChecklistService(db)
        response = service.get_by_id(response_id)
        if response is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found")
        return response.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/responses/{response_id}", response_model=dict)
def update_response(
    response_id: UUID,
    request: ChecklistResponseUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update a checklist response.
    
    Args:
        response_id: ID of the response
        request: Response update request
        db: Database session
        
    Returns:
        dict: The updated response
    """
    try:
        service = ChecklistService(db)
        response = service.get_by_id(response_id)
        if response is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found")
        
        update_data = request.model_dump(exclude_unset=True)
        updated_response = service.repository.update_by_id(response_id, update_data)
        
        return updated_response.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/inspections/{inspection_id}/completion")
def get_completion_percentage(
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get completion percentage for an inspection's checklist.
    
    Args:
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        dict: Completion percentage
    """
    try:
        service = ChecklistService(db)
        percentage = service.get_completion_percentage(inspection_id)
        return {"inspection_id": str(inspection_id), "completion_percentage": percentage}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/inspections/{inspection_id}/non-compliant")
def get_non_compliant_responses(
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get all non-compliant responses for an inspection.
    
    Args:
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        List: List of non-compliant responses
    """
    try:
        service = ChecklistService(db)
        responses = service.get_non_compliant_responses(inspection_id)
        return [r.to_dict() for r in responses]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/inspections/{inspection_id}/missing-evidence")
def get_responses_with_missing_evidence(
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get responses that require evidence but don't have it.
    
    Args:
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        List: List of responses with missing evidence
    """
    try:
        service = ChecklistService(db)
        responses = service.get_responses_with_missing_evidence(inspection_id)
        return [r.to_dict() for r in responses]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
