import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DBHelper {
  static final DBHelper _instance = DBHelper._internal();
  static Database? _database;

  factory DBHelper() {
    return _instance;
  }

  DBHelper._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB();
    return _database!;
  }

  Future<Database> _initDB() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'medicine_reminder.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        medicine_name TEXT,
        dosage TEXT,
        food_timing TEXT,
        reminder_times TEXT,
        frequency TEXT,
        days TEXT,
        start_date TEXT,
        end_date TEXT,
        notes TEXT,
        reminder_offset TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE medicine_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_id INTEGER,
        date TEXT,
        time TEXT,
        status TEXT
      )
    ''');
  }

  // --- CRUD for Medicines ---

  Future<int> insertMedicine(Map<String, dynamic> medicine) async {
    final db = await database;
    return await db.insert('medicines', medicine);
  }

  Future<List<Map<String, dynamic>>> getMedicines() async {
    final db = await database;
    return await db.query('medicines');
  }

  Future<int> updateMedicine(int id, Map<String, dynamic> medicine) async {
    final db = await database;
    return await db.update(
      'medicines',
      medicine,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> deleteMedicine(int id) async {
    final db = await database;
    return await db.delete(
      'medicines',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // --- CRUD for Medicine History ---

  Future<int> insertHistory(Map<String, dynamic> history) async {
    final db = await database;
    return await db.insert('medicine_history', history);
  }

  Future<List<Map<String, dynamic>>> getHistory() async {
    final db = await database;
    return await db.query('medicine_history', orderBy: 'date DESC, time DESC');
  }
  
  Future<List<Map<String, dynamic>>> getHistoryForDate(String date) async {
    final db = await database;
    return await db.query(
      'medicine_history',
      where: 'date = ?',
      whereArgs: [date],
      orderBy: 'time DESC',
    );
  }
}
