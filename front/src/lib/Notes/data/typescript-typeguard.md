[tags]: # '["typescript", "type guard"]'
[title]: # 'Typescript type guard function syntax'

```typescript
function isFish(pet: Fish | Bird): pet is Fish {
    return (pet as Fish).swim !== undefined;
}
```
