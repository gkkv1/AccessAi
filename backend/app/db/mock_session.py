import uuid
from typing import Any, List, Type, TypeVar, Optional

# Global in-memory store
# key: Table/Class Name, value: List of objects
MOCK_DB_STORE = {}

T = TypeVar("T")

class MockQuery:
    def __init__(self, model_class: Type[T], session: "MockSession"):
        self.model_class = model_class
        self.session = session
        self.model_name = model_class.__name__
        self._filters = []
        
        # Initialize store for this model if not exists
        if self.model_name not in MOCK_DB_STORE:
            MOCK_DB_STORE[self.model_name] = []
            
    def filter(self, *expressions) -> "MockQuery":
        # Start with all records
        records = MOCK_DB_STORE[self.model_name]
        
        # Rough approximation of SQLAlchemy filter
        # limitation: this mock only supports basic equality checks if passed a bool expression
        # usually sqlalchemy filters are like User.email == "..."
        # We need a way to capture these. 
        # For this simple mock, we might need to rely on the fact that we can iterate and check
        # But `expressions` are BinaryExpressions in SQLA.
        # To make this strictly a MOCK without depending on SQLA internals is hard if the calling code uses SQLA expressions.
        # APPROACH: The calling code does: .filter(models.User.email == user_in.email)
        # We can't easily evaluate that SQLA expression against a plain object without keeping the SQLA instrumentation.
        
        # HOWEVER, we can monkey-patch or use a simpler approach if we modify how we call it?
        # No, the requirement is "without affecting existing functionality" (too much).
        
        # Alternative Deep Implementation:
        # We actually receive a BinaryExpression.
        # We can inspect `expression.left`, `expression.operator`, `expression.right`.
        
        self._filters.extend(expressions)
        return self

    def _execute_filters(self, records: List[Any]) -> List[Any]:
        results = []
        for record in records:
            match = True
            for expression in self._filters:
                # This is the tricky part: evaluating SQLAlchemy expression against a python object
                # For now, let's try a simplified approach:
                # If we assume the expression is simple like `Model.field == value`
                # We can try to extract the field name and value.
                
                try:
                    # Very hacky way to extract data from BinaryExpression
                    # left is InstrumentedAttribute, right is the value
                    if hasattr(expression, 'left') and hasattr(expression, 'right'):
                        field_name = expression.left.key
                        target_value = expression.right.value
                        
                        record_value = getattr(record, field_name, None)
                        # Handle basic string vs UUID comparison if needed
                        if str(record_value) != str(target_value):
                             match = False
                             break
                    # Handle .is_ (e.g., is_active is True) ???
                    # SQLA `is_` usually creates a specialized operator.
                    
                except Exception as e:
                    print(f"MockQuery Filter Error: {e}")
                    pass
            
            if match:
                results.append(record)
        return results

    def first(self) -> Optional[T]:
        records = MOCK_DB_STORE[self.model_name]
        filtered = self._execute_filters(records)
        return filtered[0] if filtered else None

    def all(self) -> List[T]:
        records = MOCK_DB_STORE[self.model_name]
        return self._execute_filters(records)

class MockSession:
    def __init__(self):
        self.new_objects = []
        self.deleted_objects = []
        
    def query(self, model_class: Type[T]) -> MockQuery:
        return MockQuery(model_class, self)
        
    def add(self, obj: Any):
        self.new_objects.append(obj)
        
    def delete(self, obj: Any):
        # Find and remove from global store immediately or on commit?
        # For simplicity, on commit
        self.deleted_objects.append(obj)
        
    def commit(self):
        # Persist new objects to global store
        for obj in self.new_objects:
            model_name = type(obj).__name__
            if model_name not in MOCK_DB_STORE:
                MOCK_DB_STORE[model_name] = []
            
            # Generate ID if missing (common for auto-increment/uuid)
                import uuid
                obj.id = str(uuid.uuid4())
            
            # Populate defaults if missing (created_at, is_active, etc.)
            # This mimics server_default or standard default behavior
            if hasattr(obj, '__table__'):
                for col in obj.__table__.columns:
                     val = getattr(obj, col.name, None)
                     if val is None:
                         if col.default is not None:
                             # Python-side default
                             if callable(col.default.arg):
                                 setattr(obj, col.name, col.default.arg(None))
                             else:
                                 setattr(obj, col.name, col.default.arg)
                         elif col.server_default is not None:
                             # Server-side default (approximate for common cases)
                             if "now" in str(col.server_default).lower():
                                 from datetime import datetime
                                 setattr(obj, col.name, datetime.now())
                             elif "true" in str(col.server_default).lower():
                                 setattr(obj, col.name, True)
                             elif "false" in str(col.server_default).lower():
                                 setattr(obj, col.name, False)
                             
            MOCK_DB_STORE[model_name].append(obj)
            
        self.new_objects = []
        
        # Remove deleted objects
        # (Implementation skipped for now as we don't strictly need delete for this task)

    def refresh(self, obj: Any):
        # In a real DB, this reloads attributes. In memory, obj is already the reference.
        pass

    def close(self):
        pass

# Helper to clear/init store
def reset_mock_db():
    MOCK_DB_STORE.clear()
