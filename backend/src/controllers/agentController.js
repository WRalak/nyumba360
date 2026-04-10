const { validationResult } = require('express-validator');
const Agent = require('../models/Agent');
const AgentManagement = require('../models/AgentManagement');
const Property = require('../models/Property');
const User = require('../models/User');

class AgentController {
  static async createAgentProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        agency_name,
        license_number,
        license_expiry,
        specialization,
        service_areas,
        commission_structure,
        commission_rate,
        fixed_fee,
        bio,
        experience_years,
        languages,
        education,
        certifications,
        professional_associations,
        bank_details
      } = req.body;

      // Check if agent profile already exists for this user
      const existingAgent = await Agent.findOne({ user_id: req.user.userId });
      if (existingAgent) {
        return res.status(400).json({
          error: 'Agent profile already exists for this user'
        });
      }

      // Check if license number is already taken
      const existingLicense = await Agent.findOne({ license_number });
      if (existingLicense) {
        return res.status(400).json({
          error: 'License number already registered'
        });
      }

      const agentData = {
        user_id: req.user.userId,
        agency_name,
        license_number,
        license_expiry: new Date(license_expiry),
        specialization: specialization || [],
        service_areas: service_areas || [],
        commission_structure: commission_structure || 'percentage',
        commission_rate: commission_rate,
        fixed_fee: fixed_fee,
        bio,
        experience_years: experience_years || 0,
        languages: languages || [],
        education: education || [],
        certifications: certifications || [],
        professional_associations: professional_associations || [],
        bank_details
      };

      const agent = new Agent(agentData);
      await agent.save();

      // Populate user info for response
      await agent.populate('user_id', 'firstName lastName email phone');

      res.status(201).json({
        message: 'Agent profile created successfully',
        agent
      });
    } catch (error) {
      console.error('Create agent profile error:', error);
      res.status(500).json({
        error: 'Failed to create agent profile',
        details: error.message
      });
    }
  }

  static async getAgentProfile(req, res) {
    try {
      const agent = await Agent.findOne({ user_id: req.user.userId })
        .populate('user_id', 'firstName lastName email phone')
        .populate('managed_properties', 'property_name address')
        .populate('managed_landlords', 'firstName lastName email');

      if (!agent) {
        return res.status(404).json({
          error: 'Agent profile not found'
        });
      }

      res.json({ agent });
    } catch (error) {
      console.error('Get agent profile error:', error);
      res.status(500).json({
        error: 'Failed to retrieve agent profile',
        details: error.message
      });
    }
  }

  static async updateAgentProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const agent = await Agent.findOne({ user_id: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          error: 'Agent profile not found'
        });
      }

      const updateData = req.body;

      // Handle license number change
      if (updateData.license_number && updateData.license_number !== agent.license_number) {
        const existingLicense = await Agent.findOne({ 
          license_number: updateData.license_number,
          user_id: { $ne: req.user.userId }
        });
        if (existingLicense) {
          return res.status(400).json({
            error: 'License number already registered'
          });
        }
      }

      // Update numeric fields
      if (updateData.commission_rate) {
        updateData.commission_rate = parseFloat(updateData.commission_rate);
      }
      if (updateData.fixed_fee) {
        updateData.fixed_fee = parseFloat(updateData.fixed_fee);
      }
      if (updateData.experience_years) {
        updateData.experience_years = parseInt(updateData.experience_years);
      }

      const updatedAgent = await Agent.findOneAndUpdate(
        { user_id: req.user.userId },
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('user_id', 'firstName lastName email phone')
        .populate('managed_properties', 'property_name address')
        .populate('managed_landlords', 'firstName lastName email');

      res.json({
        message: 'Agent profile updated successfully',
        agent: updatedAgent
      });
    } catch (error) {
      console.error('Update agent profile error:', error);
      res.status(500).json({
        error: 'Failed to update agent profile',
        details: error.message
      });
    }
  }

  static async getAgentStats(req, res) {
    try {
      const agent = await Agent.findOne({ user_id: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          error: 'Agent profile not found'
        });
      }

      const stats = await Agent.getAgentStats(agent._id);

      res.json({
        agent_stats: stats
      });
    } catch (error) {
      console.error('Get agent stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve agent statistics',
        details: error.message
      });
    }
  }

  static async searchAgents(req, res) {
    try {
      const {
        county,
        area,
        specialization,
        min_rating,
        page = 1,
        limit = 20
      } = req.query;

      let agents;

      if (county) {
        agents = await Agent.findByServiceArea(county, area);
      } else {
        agents = await Agent.find({
          is_active: true,
          verification_status: 'verified'
        })
          .populate('user_id', 'firstName lastName email phone')
          .sort({ 'rating.average': -1 });
      }

      // Apply filters
      if (specialization) {
        agents = agents.filter(agent => 
          agent.specialization.includes(specialization)
        );
      }

      if (min_rating) {
        agents = agents.filter(agent => 
          agent.rating.average >= parseFloat(min_rating)
        );
      }

      // Apply pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedAgents = agents.slice(startIndex, endIndex);

      res.json({
        agents: paginatedAgents,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(agents.length / parseInt(limit)),
          total_records: agents.length,
          records_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Search agents error:', error);
      res.status(500).json({
        error: 'Failed to search agents',
        details: error.message
      });
    }
  }

  static async getTopAgents(req, res) {
    try {
      const { county, limit = 10 } = req.query;

      const agents = await Agent.findTopPerformers(parseInt(limit), county);

      res.json({
        top_agents: agents
      });
    } catch (error) {
      console.error('Get top agents error:', error);
      res.status(500).json({
        error: 'Failed to retrieve top agents',
        details: error.message
      });
    }
  }

  static async createManagementContract(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        landlord_id,
        property_ids,
        management_type,
        end_date,
        commission_structure,
        services_included,
        responsibilities,
        reporting,
        termination_clause,
        performance_targets,
        communication_preferences
      } = req.body;

      // Verify agent profile exists
      const agent = await Agent.findOne({ user_id: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          error: 'Agent profile not found'
        });
      }

      // Verify landlord exists
      const landlord = await User.findById(landlord_id);
      if (!landlord || landlord.role !== 'landlord') {
        return res.status(400).json({
          error: 'Invalid landlord'
        });
      }

      // Verify properties belong to landlord
      const properties = await Property.find({
        _id: { $in: property_ids },
        owner_id: landlord_id
      });

      if (properties.length !== property_ids.length) {
        return res.status(400).json({
          error: 'Some properties do not belong to this landlord'
        });
      }

      const contractData = {
        agent_id: agent._id,
        landlord_id,
        property_ids,
        management_type,
        end_date: end_date ? new Date(end_date) : null,
        commission_structure,
        services_included: services_included || [],
        responsibilities: responsibilities || {},
        reporting: reporting || {},
        termination_clause: termination_clause || {},
        performance_targets: performance_targets || {},
        communication_preferences: communication_preferences || {},
        status: 'pending'
      };

      const contract = new AgentManagement(contractData);
      await contract.save();

      // Update agent's managed properties and landlords
      await Agent.findByIdAndUpdate(agent._id, {
        $addToSet: {
          managed_properties: { $each: property_ids },
          managed_landlords: landlord_id
        }
      });

      // Populate related data for response
      await contract.populate([
        { path: 'agent_id', populate: { path: 'user_id', select: 'firstName lastName email' } },
        { path: 'landlord_id', select: 'firstName lastName email phone' },
        { path: 'property_ids', select: 'property_name address' }
      ]);

      res.status(201).json({
        message: 'Management contract created successfully',
        contract
      });
    } catch (error) {
      console.error('Create management contract error:', error);
      res.status(500).json({
        error: 'Failed to create management contract',
        details: error.message
      });
    }
  }

  static async getManagementContracts(req, res) {
    try {
      const agent = await Agent.findOne({ user_id: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          error: 'Agent profile not found'
        });
      }

      const contracts = await AgentManagement.findActiveByAgent(agent._id);

      res.json({
        contracts
      });
    } catch (error) {
      console.error('Get management contracts error:', error);
      res.status(500).json({
        error: 'Failed to retrieve management contracts',
        details: error.message
      });
    }
  }

  static async updateManagementContract(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verify agent profile exists
      const agent = await Agent.findOne({ user_id: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          error: 'Agent profile not found'
        });
      }

      const contract = await AgentManagement.findOne({
        _id: id,
        agent_id: agent._id
      });

      if (!contract) {
        return res.status(404).json({
          error: 'Management contract not found'
        });
      }

      const updatedContract = await AgentManagement.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('landlord_id', 'firstName lastName email phone')
        .populate('property_ids', 'property_name address');

      res.json({
        message: 'Management contract updated successfully',
        contract: updatedContract
      });
    } catch (error) {
      console.error('Update management contract error:', error);
      res.status(500).json({
        error: 'Failed to update management contract',
        details: error.message
      });
    }
  }

  static async getManagedProperties(req, res) {
    try {
      const agent = await Agent.findOne({ user_id: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          error: 'Agent profile not found'
        });
      }

      const properties = await Property.find({
        _id: { $in: agent.managed_properties }
      })
        .populate('owner_id', 'firstName lastName email phone')
        .sort({ property_name: 1 });

      res.json({
        managed_properties: properties
      });
    } catch (error) {
      console.error('Get managed properties error:', error);
      res.status(500).json({
        error: 'Failed to retrieve managed properties',
        details: error.message
      });
    }
  }

  static async addNoteToContract(req, res) {
    try {
      const { id } = req.params;
      const { content, is_internal = false } = req.body;

      const agent = await Agent.findOne({ user_id: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          error: 'Agent profile not found'
        });
      }

      const contract = await AgentManagement.findOne({
        _id: id,
        agent_id: agent._id
      });

      if (!contract) {
        return res.status(404).json({
          error: 'Management contract not found'
        });
      }

      const note = {
        content,
        added_by: req.user.userId,
        is_internal
      };

      const updatedContract = await AgentManagement.findByIdAndUpdate(
        id,
        { $push: { notes: note } },
        { new: true }
      ).populate('notes.added_by', 'firstName lastName');

      res.json({
        message: 'Note added successfully',
        note: updatedContract.notes[updatedContract.notes.length - 1]
      });
    } catch (error) {
      console.error('Add note error:', error);
      res.status(500).json({
        error: 'Failed to add note',
        details: error.message
      });
    }
  }
}

module.exports = AgentController;
