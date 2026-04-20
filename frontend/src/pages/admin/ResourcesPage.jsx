import React, { useState, useEffect } from 'react'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { useToast } from '../../components/toastContext.js'
import {
  fetchResources,
  createResource,
  updateResource,
  deleteResource,
} from '../../api/resourceApi.js'
import './ResourcesPage.css'

export default function ResourcesPage() {
  const { pushToast } = useToast()
  const showToast = React.useCallback((message, type='success') => {
    pushToast({ type, message })
  }, [pushToast])
  const formatType = (type) => (typeof type === 'string' ? type.replace(/_/g, ' ') : 'N/A')
  const formatStatus = (status) => (typeof status === 'string' ? status.replace(/_/g, ' ') : 'UNKNOWN')
  const statusClass = (status) =>
    typeof status === 'string' ? status.toLowerCase() : 'unknown'
  const formatAvailabilityWindows = (availabilityWindows) => {
    if (!Array.isArray(availabilityWindows) || availabilityWindows.length === 0) {
      return []
    }
    return availabilityWindows.filter((window) => typeof window === 'string' && window.trim() !== '')
  }
  
  const [resources, setResources] = useState([])
  const [filters, setFilters] = useState({ type: '', capacity: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [resourceFormCategory, setResourceFormCategory] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: '',
    quantity: '',
    location: '',
    availabilityWindows: '',
    status: 'ACTIVE',
    photoUrl: ''
  })
  const isEquipmentForm =
    resourceFormCategory === 'EQUIPMENT' || formData.type === 'EQUIPMENT'
  const parseAvailabilityWindowsInput = (value) => {
    return value
      .split(',')
      .map((slot) => slot.trim())
      .filter(Boolean)
  }
  const isValidTimeRange = (slot) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot)
  const formErrors = React.useMemo(() => {
    const errors = {}
    const name = formData.name.trim()
    const location = formData.location.trim()
    const windows = parseAvailabilityWindowsInput(formData.availabilityWindows)
    const duplicateLocation = resources.some((resource) => {
      const resourceLocation = typeof resource.location === 'string' ? resource.location.trim() : ''
      if (!resourceLocation) return false
      if (editingResource?.id && resource.id === editingResource.id) return false
      return resourceLocation.toUpperCase() === location.toUpperCase()
    })

    if (!name) {
      errors.name = isEquipmentForm ? 'Equipment name is required.' : 'Resource name is required.'
    } else if (name.length < 3) {
      errors.name = 'Name must be at least 3 characters.'
    }

    if (!isEquipmentForm) {
      const capacity = parseInt(formData.capacity, 10)
      if (formData.capacity === '') {
        errors.capacity = 'Capacity is required.'
      } else if (Number.isNaN(capacity) || capacity < 1) {
        errors.capacity = 'Capacity must be at least 1.'
      }
      if (!['LECTURE_HALL', 'LAB', 'MEETING_ROOM'].includes(formData.type)) {
        errors.type = 'Please select a valid type.'
      }
    } else {
      const quantity = parseInt(formData.quantity, 10)
      if (formData.quantity === '') {
        errors.quantity = 'Available quantity is required.'
      } else if (Number.isNaN(quantity) || quantity < 1) {
        errors.quantity = 'Available quantity must be at least 1.'
      }
    }

    if (!location) {
      errors.location = isEquipmentForm ? 'Storage location is required.' : 'Location is required.'
    } else if (duplicateLocation) {
      errors.location = `Location already exists (${location.toUpperCase()}).`
    }

    if (windows.length === 0) {
      errors.availabilityWindows = 'At least one availability window is required.'
    } else if (windows.some((slot) => !isValidTimeRange(slot))) {
      errors.availabilityWindows = 'Use HH:MM-HH:MM format, separated by commas.'
    }

    if (!['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'].includes(formData.status)) {
      errors.status = 'Please select a valid status.'
    }

    return errors
  }, [formData, isEquipmentForm, resources, editingResource])
  const isFormValid = Object.keys(formErrors).length === 0

  const loadResources = React.useCallback(async () => {
    try {
      const data = await fetchResources(filters)
      setResources(Array.isArray(data) ? data : [])
    } catch {
      setResources([])
      showToast('Failed to load resources', 'error')
    }
  }, [filters, showToast])

  useEffect(() => {
    loadResources()
  }, [loadResources]) // Automatically re-run when filters change (via loadResources dependency)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handleOpenModal = (resource = null) => {
    setPhotoFile(null)
    if (resource) {
      setEditingResource(resource)
      setResourceFormCategory(resource.type === 'EQUIPMENT' ? 'EQUIPMENT' : 'SPACE')
      setFormData({
        name: resource.name,
        type: resource.type,
        capacity: resource.capacity,
        quantity: resource.quantity ?? '',
        location: resource.location,
        availabilityWindows: resource.availabilityWindows ? resource.availabilityWindows.join(', ') : '',
        status: resource.status,
        photoUrl: resource.photoUrl || ''
      })
    } else {
      setEditingResource(null)
      setResourceFormCategory(null)
      setFormData({
        name: '',
        type: 'LECTURE_HALL',
        capacity: '',
        quantity: '',
        location: '',
        availabilityWindows: '',
        status: 'ACTIVE',
        photoUrl: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setResourceFormCategory(null)
  }

  const handleCategorySelect = (category) => {
    setResourceFormCategory(category)
    setFormData((prev) => ({
      ...prev,
      type: category === 'EQUIPMENT' ? 'EQUIPMENT' : 'LECTURE_HALL',
      name: '',
      capacity: '',
      quantity: '',
      location: '',
      availabilityWindows: '',
      status: 'ACTIVE',
      photoUrl: '',
    }))
    setPhotoFile(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === 'type') {
        if (value === 'LAB' && (prev.capacity === '' || prev.capacity === null)) {
          return { ...prev, type: value, capacity: '60' }
        }
        return { ...prev, type: value }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid) {
      showToast('Please fix the validation errors before saving.', 'error')
      return
    }
    try {
      const normalizedCapacity =
        formData.capacity === '' || Number.isNaN(parseInt(formData.capacity, 10))
          ? null
          : parseInt(formData.capacity, 10)
      const normalizedQuantity =
        formData.quantity === '' || Number.isNaN(parseInt(formData.quantity, 10))
          ? null
          : parseInt(formData.quantity, 10)
      const payload = {
        ...formData,
        capacity: normalizedCapacity,
        quantity: normalizedQuantity,
        availabilityWindows: parseAvailabilityWindowsInput(formData.availabilityWindows)
      }
      
      if (editingResource) {
        await updateResource(editingResource.id, payload, photoFile)
        showToast('Resource updated successfully', 'success')
      } else {
        await createResource(payload, photoFile)
        showToast('Resource created successfully', 'success')
      }
      handleCloseModal()
      loadResources()
    } catch (err) {
      showToast(err.message || 'Failed to save resource', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteResource(id)
        showToast('Resource deleted', 'success')
        loadResources()
      } catch {
        showToast('Failed to delete resource', 'error')
      }
    }
  }

  return (
    <div className="resources-page">
      <div className="resources-header">
        <h1>Facilities & Assets</h1>
        <button className="add-resource-btn" onClick={() => handleOpenModal()}>
          <FaPlus /> Add Resource
        </button>
      </div>

      <div className="filters-container">
        <div className="resource-tabs">
          <button 
            className={`tab-btn ${filters.type === '' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, type: '' })}
          >
            All Resources
          </button>
          <button 
            className={`tab-btn ${filters.type === 'LECTURE_HALL' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, type: 'LECTURE_HALL' })}
          >
            Lecture Halls
          </button>
          <button 
            className={`tab-btn ${filters.type === 'LAB' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, type: 'LAB' })}
          >
            Labs
          </button>
          <button 
            className={`tab-btn ${filters.type === 'MEETING_ROOM' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, type: 'MEETING_ROOM' })}
          >
            Meeting Rooms
          </button>
          <button 
            className={`tab-btn ${filters.type === 'EQUIPMENT' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, type: 'EQUIPMENT' })}
          >
            Equipment
          </button>
        </div>

        <div className="filters-bar">
          <div className="filter-group">
            <label>Min Capacity</label>
            <input 
              type="number" 
              name="capacity" 
              placeholder="E.g. 50" 
              value={filters.capacity} 
              onChange={handleFilterChange} 
            />
          </div>
        </div>
      </div>

      <div className="resources-cards-container">
        {resources.length === 0 ? (
          <div className="resources-empty-state">
            No resources found. Try adjusting your filters or add a new resource.
          </div>
        ) : (
          <div className="resources-cards-grid">
            {resources.map((res) => (
              <article key={res.id} className="resource-card">
                <div className="resource-card-image-wrap">
                  <img
                    src={res.photoUrl || 'https://placehold.co/600x400?text=No+Photo'}
                    alt={res.name || 'Resource image'}
                    className="resource-thumbnail"
                  />
                  <span className={`status-badge ${statusClass(res.status)}`}>
                    {formatStatus(res.status)}
                  </span>
                </div>
                <div className="resource-card-body">
                  <h3 className="resource-card-title">{res.name || 'Untitled Resource'}</h3>
                  <p className="resource-card-type">{formatType(res.type)}</p>
                  <div className="resource-card-details">
                    <div className="resource-card-detail">
                      <span>{res.type === 'EQUIPMENT' ? 'Available Qty' : 'Capacity'}</span>
                      <strong>{res.type === 'EQUIPMENT' ? (res.quantity ?? 'N/A') : (res.capacity ?? 'N/A')}</strong>
                    </div>
                    <div className="resource-card-detail">
                      <span>Location</span>
                      <strong>{res.location || 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="resource-card-availability">
                    <span className="availability-label">Availability</span>
                    {formatAvailabilityWindows(res.availabilityWindows).length > 0 ? (
                      <div className="availability-chips">
                        {formatAvailabilityWindows(res.availabilityWindows).map((window, idx) => (
                          <span key={`${res.id}-availability-${idx}`} className="availability-chip">
                            {window}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="availability-empty">No availability windows set</p>
                    )}
                  </div>
                  <div className="action-buttons">
                    <button className="btn-icon edit" onClick={() => handleOpenModal(res)}>
                      <FaEdit />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDelete(res.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
            <p className="modal-subtitle">
              {editingResource
                ? 'Update resource details and availability.'
                : 'Create a new resource by selecting a category and filling the form.'}
            </p>
            {!editingResource && !resourceFormCategory ? (
              <div className="resource-category-picker">
                <button
                  type="button"
                  className="resource-category-card"
                  onClick={() => handleCategorySelect('EQUIPMENT')}
                >
                  <strong>EQUIPMENT</strong>
                  <span>Cameras, tools, devices and other assets</span>
                </button>
                <button
                  type="button"
                  className="resource-category-card"
                  onClick={() => handleCategorySelect('SPACE')}
                >
                  <strong>LABS / LECTURE HALLS</strong>
                  <span>Bookable spaces for classes and practicals</span>
                </button>
              </div>
            ) : (
            <form className="resource-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{isEquipmentForm ? 'Equipment Name' : 'Resource Name'}</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={formErrors.name ? 'input-error' : ''}
                  placeholder={isEquipmentForm ? 'e.g. DSLR Camera' : 'e.g. Auditorium A'}
                />
                {formErrors.name && <p className="field-error">{formErrors.name}</p>}
              </div>
              <div className="form-group">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {formData.photoUrl && !photoFile && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Current photo: {formData.photoUrl}</p>
                )}
              </div>
              <div className="form-group">
                <label>Type</label>
                {isEquipmentForm ? (
                  <input className="readonly-input" value="Equipment" readOnly />
                ) : (
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="LAB">Lab</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                  </select>
                )}
                {formErrors.type && <p className="field-error">{formErrors.type}</p>}
              </div>
              {!isEquipmentForm && (
                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className={formErrors.capacity ? 'input-error' : ''}
                    placeholder="e.g. 150"
                  />
                  {formErrors.capacity && <p className="field-error">{formErrors.capacity}</p>}
                </div>
              )}
              {isEquipmentForm && (
                <div className="form-group">
                  <label>Available Quantity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className={formErrors.quantity ? 'input-error' : ''}
                    placeholder="e.g. 20"
                  />
                  {formErrors.quantity && <p className="field-error">{formErrors.quantity}</p>}
                </div>
              )}
              <div className="form-group">
                <label>{isEquipmentForm ? 'Storage Location' : 'Location'}</label>
                <input
                  required
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={formErrors.location ? 'input-error' : ''}
                  placeholder={isEquipmentForm ? 'e.g. Media Room, Rack B2' : 'e.g. Building 1, Floor 2'}
                />
                {formErrors.location && <p className="field-error">{formErrors.location}</p>}
              </div>
              <div className="form-group">
                <label>{isEquipmentForm ? 'Available Time (comma separated)' : 'Availability Windows (comma separated)'}</label>
                <input
                  required
                  name="availabilityWindows"
                  value={formData.availabilityWindows}
                  onChange={handleChange}
                  className={formErrors.availabilityWindows ? 'input-error' : ''}
                  placeholder={isEquipmentForm ? 'e.g. 09:00-11:00, 14:00-16:00' : 'e.g. 08:00-12:00, 13:00-17:00'}
                />
                {formErrors.availabilityWindows && (
                  <p className="field-error">{formErrors.availabilityWindows}</p>
                )}
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                </select>
                {formErrors.status && <p className="field-error">{formErrors.status}</p>}
              </div>

              <div className="modal-actions">
                {!editingResource && (
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setResourceFormCategory(null)}
                  >
                    Back
                  </button>
                )}
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-save" disabled={!isFormValid}>
                  Save Resource
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
