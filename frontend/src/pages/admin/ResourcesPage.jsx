import React, { useState, useEffect } from 'react'
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa'
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
  
  const [resources, setResources] = useState([])
  const [filters, setFilters] = useState({ type: '', capacity: '', location: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: '',
    location: '',
    availabilityWindows: '',
    status: 'ACTIVE',
    photoUrl: ''
  })

  const loadResources = React.useCallback(async () => {
    try {
      const data = await fetchResources(filters)
      const normalized = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : []
      setResources(normalized.filter(Boolean))
    } catch {
      showToast('Failed to load resources', 'error')
      setResources([])
    }
  }, [filters, showToast])

  useEffect(() => {
    loadResources()
  }, [loadResources]) // Automatically re-run when filters change (via loadResources dependency)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handleSearch = () => {
    loadResources()
  }

  const handleOpenModal = (resource = null) => {
    setPhotoFile(null)
    if (resource) {
      setEditingResource(resource)
      setFormData({
        name: resource.name || '',
        type: resource.type || 'LECTURE_HALL',
        capacity: resource.capacity ?? '',
        location: resource.location || '',
        availabilityWindows: Array.isArray(resource.availabilityWindows)
          ? resource.availabilityWindows.join(', ')
          : '',
        status: resource.status || 'ACTIVE',
        photoUrl: resource.photoUrl || ''
      })
    } else {
      setEditingResource(null)
      setFormData({
        name: '',
        type: 'LECTURE_HALL',
        capacity: '',
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
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
        availabilityWindows: formData.availabilityWindows.split(',').map(s => s.trim()).filter(Boolean)
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
            <label>Location Area</label>
            <div className="input-with-icon">
              <FaSearch className="input-icon" />
              <input 
                type="text" 
                name="location" 
                placeholder="Search location..." 
                value={filters.location} 
                onChange={handleFilterChange} 
              />
            </div>
          </div>
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

      <div className="resources-table-container">
        <table className="resources-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((res, idx) => (
              <tr key={res.id || `${res.name || 'resource'}-${idx}`}>
                <td>
                  <img 
                    src={res.photoUrl || 'https://placehold.co/100x100?text=No+Photo'} 
                    alt={res.name || 'Resource'} 
                    className="resource-thumbnail" 
                  />
                </td>
                <td style={{ fontWeight: 600 }}>{res.name || 'Unnamed Resource'}</td>
                <td>{String(res.type || 'UNKNOWN').replace(/_/g, ' ')}</td>
                <td>{res.capacity ?? '-'}</td>
                <td>{res.location || '-'}</td>
                <td>
                  <span className={`status-badge ${String(res.status || 'unknown').toLowerCase().replace(/_/g, '')}`}>
                    {String(res.status || 'UNKNOWN').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="action-buttons">
                  <button className="btn-icon edit" onClick={() => handleOpenModal(res)}>
                    <FaEdit />
                  </button>
                  <button className="btn-icon delete" onClick={() => handleDelete(res.id)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No resources found. Try adjusting your filters or add a new resource.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Resource Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Auditorium A" />
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
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="LECTURE_HALL">Lecture Hall</option>
                  <option value="LAB">Lab</option>
                  <option value="MEETING_ROOM">Meeting Room</option>
                  <option value="EQUIPMENT">Equipment</option>
                </select>
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input required type="number" min="1" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="e.g. 150" />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input required name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Building 1, Floor 2" />
              </div>
              <div className="form-group">
                <label>Availability Windows (comma separated)</label>
                <input name="availabilityWindows" value={formData.availabilityWindows} onChange={handleChange} placeholder="e.g. 08:00-12:00, 13:00-17:00" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-save">Save Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
