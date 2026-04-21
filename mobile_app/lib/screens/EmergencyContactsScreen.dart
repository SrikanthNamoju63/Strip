import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';
import '../widgets/empty_state_widget.dart';

class EmergencyContactsScreen extends StatefulWidget {
  const EmergencyContactsScreen({super.key});

  @override
  State<EmergencyContactsScreen> createState() =>
      _EmergencyContactsScreenState();
}

class _EmergencyContactsScreenState extends State<EmergencyContactsScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> contacts = [];
  bool isLoading = true;

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _relationshipController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    setState(() => isLoading = true);
    try {
      final result = await _apiService.getEmergencyContacts();

      if (result != null && mounted) {
        setState(() {
          contacts = result['contacts'] ?? [];
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading contacts: $e')));
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _addContact() async {
    if (_nameController.text.isEmpty || _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill required fields')),
      );
      return;
    }

    try {
      final result = await _apiService.addEmergencyContact(
        name: _nameController.text,
        phone: _phoneController.text,
        relationship: _relationshipController.text,
      );

      if (result != null && mounted) {
        Navigator.pop(context);
        _clearControllers();
        _loadContacts();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contact added successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error adding contact: $e')));
      }
    }
  }

  Future<void> _deleteContact(String contactId) async {
    try {
      final result = await _apiService.deleteEmergencyContact(contactId);
      if (result != null && mounted) {
        _loadContacts();
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Contact deleted')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error deleting contact: $e')));
      }
    }
  }

  void _clearControllers() {
    _nameController.clear();
    _phoneController.clear();
    _relationshipController.clear();
  }

  void _showAddContactDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (context) => Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              left: 16,
              right: 16,
              top: 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Add Emergency Contact',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _nameController,
                    label: 'Name',
                    hint: 'Contact name',
                  ),
                  _buildTextField(
                    controller: _relationshipController,
                    label: 'Relationship',
                    hint: 'e.g., Mother, Brother, Friend',
                  ),
                  _buildTextField(
                    controller: _phoneController,
                    label: 'Phone Number',
                    hint: '+91 XXXXX XXXXX',
                    inputType: TextInputType.phone,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _addContact,
                      child: const Text('Add Contact'),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType inputType = TextInputType.text,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        keyboardType: inputType,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Emergency Contacts'), elevation: 0),
      body:
          isLoading
              ? const Center(child: CircularProgressIndicator())
              : contacts.isEmpty
              ? EmptyStateWidget(
                title: 'No Emergency Contacts',
                message: 'Add trusted contacts for emergencies',
                onAction: _showAddContactDialog,
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: contacts.length,
                itemBuilder: (context, index) {
                  final contact = contacts[index];
                  return _ContactCard(
                        contact: contact,
                        onDelete: () => _deleteContact(contact['_id']),
                      )
                      .animate()
                      .fadeIn(duration: (300 + index * 100).ms)
                      .slideX(
                        begin: 0.2,
                        duration: (300 + index * 100).ms,
                        curve: Curves.easeOut,
                      );
                },
              ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddContactDialog,
        child: const Icon(Icons.add),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }
}

class _ContactCard extends StatelessWidget {
  final Map<String, dynamic> contact;
  final VoidCallback onDelete;

  const _ContactCard({required this.contact, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.withValues(alpha: 0.2),
          child: Icon(Icons.contacts, color: Colors.blue),
        ),
        title: Text(
          contact['name'] ?? 'Unknown',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (contact['relationship'] != null) Text(contact['relationship']),
            Text(contact['phone'] ?? 'N/A'),
          ],
        ),
        trailing: PopupMenuButton(
          itemBuilder:
              (context) => [
                PopupMenuItem(onTap: onDelete, child: const Text('Delete')),
              ],
        ),
      ),
    );
  }
}
